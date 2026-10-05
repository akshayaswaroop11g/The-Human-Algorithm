/**
 * BEHAVIORAL SCORING
 *
 * Turns a list of answers into:
 *   • tallies — "in how many decisions did this dimension matter, and how
 *     often did you pick the option that scored higher on it?"
 *   • scores  — a 0–100 number per dimension (50 = no lean).
 *
 * The numbers each option contributes live in src/data/scenarios.ts;
 * the labels and thresholds live in src/config/scoring.ts.
 */
import { DIMENSION_ORDER, SCORING } from '../config/scoring'
import { getScenario } from '../data/scenarios'
import type { Dimension, DimensionTally, ResponseRecord, ScenarioOption } from '../types'

/** Effect of an option on one dimension (missing = 0). */
export function effectOf(option: ScenarioOption, dimension: Dimension): number {
  return option.effects[dimension] ?? 0
}

function emptyRecord<T>(make: (d: Dimension) => T): Record<Dimension, T> {
  return Object.fromEntries(DIMENSION_ORDER.map((d) => [d, make(d)])) as Record<Dimension, T>
}

/** Count, per dimension, how often the "higher" option was chosen. */
export function computeTallies(responses: ResponseRecord[]): Record<Dimension, DimensionTally> {
  const tallies = emptyRecord<DimensionTally>((d) => ({ dimension: d, opportunities: 0, choseHigher: 0 }))

  for (const response of responses) {
    const scenario = getScenario(response.scenarioId)
    if (!scenario) continue
    const [optionA, optionB] = scenario.options
    const chosen = response.selectedOption === 'A' ? optionA : optionB
    const other = response.selectedOption === 'A' ? optionB : optionA

    for (const d of DIMENSION_ORDER) {
      const chosenEffect = effectOf(chosen, d)
      const otherEffect = effectOf(other, d)
      if (chosenEffect === otherEffect) continue // this decision says nothing about d
      tallies[d].opportunities += 1
      if (chosenEffect > otherEffect) tallies[d].choseHigher += 1
    }
  }
  return tallies
}

/**
 * 0–100 score per dimension.
 * score = (what you scored − lowest possible) / (highest possible − lowest possible) × 100
 * Returns null for a dimension with too little evidence.
 */
export function computeScores(responses: ResponseRecord[]): Record<Dimension, number | null> {
  const raw = emptyRecord(() => 0)
  const min = emptyRecord(() => 0)
  const max = emptyRecord(() => 0)
  const tallies = computeTallies(responses)

  for (const response of responses) {
    const scenario = getScenario(response.scenarioId)
    if (!scenario) continue
    const [optionA, optionB] = scenario.options
    const chosen = response.selectedOption === 'A' ? optionA : optionB
    for (const d of DIMENSION_ORDER) {
      const a = effectOf(optionA, d)
      const b = effectOf(optionB, d)
      raw[d] += effectOf(chosen, d)
      min[d] += Math.min(a, b)
      max[d] += Math.max(a, b)
    }
  }

  return emptyRecord((d) => {
    if (tallies[d].opportunities < SCORING.minOpportunitiesForScore || max[d] === min[d]) return null
    return Math.round(((raw[d] - min[d]) / (max[d] - min[d])) * 100)
  })
}

/** Share of relevant decisions where the "higher" option was chosen (0–1). */
export function shareHigher(tally: DimensionTally): number {
  return tally.opportunities === 0 ? 0.5 : tally.choseHigher / tally.opportunities
}

/**
 * How clear a pattern is: 0 = evenly split, 1 = always the same way
 * with plenty of evidence. Used to pick the "most influential factor".
 */
export function patternStrength(tally: DimensionTally): number {
  const lean = Math.abs(shareHigher(tally) - 0.5) * 2
  const evidence = Math.min(1, tally.opportunities / 4)
  return lean * evidence
}

/** The dimension with the clearest pattern, or null if nothing stands out. */
export function mostInfluentialDimension(
  tallies: Record<Dimension, DimensionTally>,
): { dimension: Dimension; direction: 'high' | 'low' } | null {
  let best: Dimension | null = null
  let bestStrength = 0
  for (const d of DIMENSION_ORDER) {
    const t = tallies[d]
    if (t.opportunities < SCORING.minOpportunitiesForInsight) continue
    const s = patternStrength(t)
    if (s > bestStrength) {
      best = d
      bestStrength = s
    }
  }
  if (!best || bestStrength < 0.25) return null
  return { dimension: best, direction: shareHigher(tallies[best]) >= 0.5 ? 'high' : 'low' }
}
