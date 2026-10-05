/**
 * AGGREGATED RESULTS (for "Explore the Data" and experiment pages)
 *
 * Takes a list of sessions — real ones from this device, or the clearly
 * labelled synthetic sample — and counts how often each option was chosen.
 * Only counts leave this function; no individual answers are shown.
 */
import { SCENARIOS } from '../data/scenarios'
import type { Category, Session } from '../types'
import { median } from '../utils/random'

export interface ScenarioAggregate {
  scenarioId: string
  n: number
  countA: number
  countB: number
  /** 0–1, or null if nobody answered. */
  shareA: number | null
  medianResponseMs: number | null
}

export interface Aggregate {
  participants: number
  decisions: number
  perScenario: Record<string, ScenarioAggregate>
  predictionsMade: number
  /** 0–1 across all sessions, or null. */
  modelAccuracy: number | null
  categoryTimes: { category: Category; medianSeconds: number; n: number }[]
}

/** Below this many participants, results are labelled "Early results". */
export const EARLY_RESULTS_THRESHOLD = 30

export function aggregateSessions(sessions: Session[]): Aggregate {
  const active = sessions.filter((s) => s.responses.length > 0)
  const perScenario: Record<string, ScenarioAggregate> = {}
  const times: Record<string, number[]> = {}

  for (const s of SCENARIOS) {
    perScenario[s.id] = { scenarioId: s.id, n: 0, countA: 0, countB: 0, shareA: null, medianResponseMs: null }
    times[s.id] = []
  }

  const categoryTimes = new Map<Category, number[]>()
  let decisions = 0
  let predictionsMade = 0
  let predictionsCorrect = 0

  for (const session of active) {
    for (const r of session.responses) {
      const agg = perScenario[r.scenarioId]
      if (!agg) continue
      decisions++
      agg.n++
      if (r.selectedOption === 'A') agg.countA++
      else agg.countB++
      times[r.scenarioId].push(r.responseTimeMs)
      const list = categoryTimes.get(r.category) ?? []
      list.push(r.responseTimeMs)
      categoryTimes.set(r.category, list)
    }
    predictionsMade += session.predictions.length
    predictionsCorrect += session.predictions.filter((p) => p.correct).length
  }

  for (const id of Object.keys(perScenario)) {
    const agg = perScenario[id]
    agg.shareA = agg.n ? agg.countA / agg.n : null
    agg.medianResponseMs = median(times[id])
  }

  return {
    participants: active.length,
    decisions,
    perScenario,
    predictionsMade,
    modelAccuracy: predictionsMade ? predictionsCorrect / predictionsMade : null,
    categoryTimes: [...categoryTimes.entries()]
      .map(([category, list]) => ({ category, medianSeconds: Math.round((median(list)! / 1000) * 10) / 10, n: list.length }))
      .sort((a, b) => a.medianSeconds - b.medianSeconds),
  }
}
