/**
 * SYNTHETIC SAMPLE DATA — FOR DEMO / LAYOUT PURPOSES ONLY.
 *
 * These are NOT real participants. They are simulated "agents", each given a
 * random lean on every dimension, who then answer the 25 scenarios with noise.
 * Their answers therefore reflect the scoring config, not human behaviour.
 *
 * The UI always labels this data as "Sample data — synthetic" and keeps it
 * separate from real responses. Generated with a fixed seed, so it is
 * identical on every load.
 */
import { DIMENSION_ORDER } from '../config/scoring'
import { activeModel } from '../logic/prediction'
import { effectOf } from '../logic/scoring'
import type { Dimension, OptionId, ResponseRecord, Session } from '../types'
import { gaussian, seededRandom } from '../utils/random'
import { SCENARIOS } from './scenarios'

export const SAMPLE_SIZE = 240
const SEED = 20261004

let cache: Session[] | null = null

export function getSampleSessions(): Session[] {
  if (cache) return cache
  const rand = seededRandom(SEED)
  const sessions: Session[] = []

  for (let i = 0; i < SAMPLE_SIZE; i++) {
    const id = `SAMPLE-${String(i + 1).padStart(3, '0')}`
    const lean = {} as Record<Dimension, number>
    for (const d of DIMENSION_ORDER) lean[d] = Math.max(-1, Math.min(1, gaussian(rand) * 0.55))
    const speed = 0.7 + rand() * 0.9 // some agents are simply faster

    const responses: ResponseRecord[] = []
    const predictions: Session['predictions'] = []
    const start = Date.UTC(2026, 0, 1) + i * 3_600_000

    for (const scenario of SCENARIOS) {
      const [a, b] = scenario.options
      const utility = DIMENSION_ORDER.reduce((sum, d) => sum + (effectOf(a, d) - effectOf(b, d)) * lean[d], 0)
      const pA = 1 / (1 + Math.exp(-(1.2 * utility + gaussian(rand) * 0.9)))
      const choice: OptionId = rand() < pA ? 'A' : 'B'

      if (scenario.phase === 'predict') {
        const p = activeModel.predict(scenario, responses, id)
        predictions.push({
          scenarioId: scenario.id,
          predictedOption: p.optionId,
          actualOption: choice,
          correct: p.optionId === choice,
          confidence: p.confidence,
          mode: 'sealed',
          modelId: p.modelId,
        })
      }

      const ms = Math.round((2200 + scenario.complexity * 1300 + Math.abs(gaussian(rand)) * 2500) * speed)
      responses.push({
        sessionId: id,
        scenarioId: scenario.id,
        category: scenario.category,
        selectedOption: choice,
        responseTimeMs: ms,
        timestamp: new Date(start + responses.length * 8000).toISOString(),
        signals: (choice === 'A' ? a : b).effects,
      })
    }

    sessions.push({ id, startedAt: new Date(start).toISOString(), completedAt: new Date(start + 300_000).toISOString(), responses, predictions, synthetic: true })
  }

  cache = sessions
  return sessions
}
