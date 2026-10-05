/**
 * THE PREDICTION ENGINE
 *
 * MVP model: a transparent, rule-based "lean" model.
 *
 *   1. From your previous answers, compute a 0–100 score per dimension.
 *   2. Turn each score into a lean between −1 and +1 (50 → 0).
 *      Leans backed by few decisions are shrunk toward 0.
 *   3. For the new scenario, add up option A's effects × your leans,
 *      and the same for option B. The higher total is the prediction.
 *   4. The gap between the totals becomes a confidence (50 % – 92 %).
 *
 * To plug in a different model later (e.g. machine learning), write another
 * object that matches the `PredictionModel` interface and change `activeModel`.
 */
import { DIMENSIONS, DIMENSION_ORDER, PREDICTION } from '../config/scoring'
import type { Dimension, OptionId, Prediction, PredictionRecord, ResponseRecord, Scenario } from '../types'
import { hashToUnit } from '../utils/random'
import { computeScores, computeTallies, effectOf } from './scoring'

export interface PredictionModel {
  id: string
  name: string
  /**
   * @param scenario the upcoming scenario
   * @param history  answers given so far (never includes this scenario)
   * @param seed     a stable string (e.g. the session id) used for tie-breaks
   */
  predict(scenario: Scenario, history: ResponseRecord[], seed: string): Prediction
}

/** Leans per dimension, −1 … +1, shrunk by how much evidence exists. */
export function computeLeans(history: ResponseRecord[]): Record<Dimension, number> {
  const scores = computeScores(history)
  const tallies = computeTallies(history)
  const leans = {} as Record<Dimension, number>
  for (const d of DIMENSION_ORDER) {
    const score = scores[d]
    const n = tallies[d].opportunities
    leans[d] = score === null ? 0 : ((score - 50) / 50) * (n / (n + PREDICTION.evidencePrior))
  }
  return leans
}

const logistic = (x: number) => 1 / (1 + Math.exp(-x))

export const ruleBasedModel: PredictionModel = {
  id: 'lean-v1',
  name: 'Rule-based lean model',

  predict(scenario, history, seed) {
    const leans = computeLeans(history)
    const tallies = computeTallies(history)
    const [optionA, optionB] = scenario.options

    // Positive = model prefers A. Each dimension contributes (A − B) × lean.
    const contributions = DIMENSION_ORDER.map((d) => ({
      dimension: d,
      value: (effectOf(optionA, d) - effectOf(optionB, d)) * leans[d],
    }))
    const total = contributions.reduce((sum, c) => sum + c.value, 0)

    // No usable signal → coin flip, decided by a stable hash so it never changes on reload.
    if (Math.abs(total) < 0.01) {
      const pick: OptionId = hashToUnit(seed + scenario.id) < 0.5 ? 'A' : 'B'
      return {
        optionId: pick,
        confidence: 0.5,
        reasoning: 'None of your earlier decisions bear strongly on this one. This prediction is close to a coin flip.',
        modelId: this.id,
      }
    }

    const probabilityA = logistic(PREDICTION.sharpness * total)
    const optionId: OptionId = probabilityA >= 0.5 ? 'A' : 'B'
    const confidence = Math.min(PREDICTION.maxConfidence, Math.max(probabilityA, 1 - probabilityA))

    // Explain using the dimension that pushed hardest toward the predicted option.
    const sign = optionId === 'A' ? 1 : -1
    const top = contributions.slice().sort((x, y) => y.value * sign - x.value * sign)[0]
    const predicted = optionId === 'A' ? optionA : optionB
    const other = optionId === 'A' ? optionB : optionA
    const predictedIsHigher = effectOf(predicted, top.dimension) > effectOf(other, top.dimension)
    const t = tallies[top.dimension]
    const count = predictedIsHigher ? t.choseHigher : t.opportunities - t.choseHigher
    const config = DIMENSIONS[top.dimension]
    const verb = predictedIsHigher ? config.reasonHigh : config.reasonLow

    const topic = config.label.toLowerCase()
    const reasoning =
      count * 2 > t.opportunities
        ? `In ${count} of ${t.opportunities} earlier ${t.opportunities === 1 ? 'decision' : 'decisions'} involving ${topic}, you ${verb}.`
        : // Counts alone are split, but the strongly-weighted scenarios leaned one way.
          `Your earlier decisions involving ${topic} were split (${count} of ${t.opportunities}), but the ones that tested it most strongly leaned toward the option where you ${verb}.`

    return { optionId, confidence, reasoning, modelId: this.id }
  },
}

/** The model the app uses. Swap this line to try a different model. */
export const activeModel: PredictionModel = ruleBasedModel

/* ───────────── Accuracy & streak helpers ───────────── */

/** Share of correct predictions (0–1), or null if none were made. */
export function predictionAccuracy(predictions: PredictionRecord[]): number | null {
  if (predictions.length === 0) return null
  return predictions.filter((p) => p.correct).length / predictions.length
}

export interface StreakStats {
  /** Predictions the model got wrong = choices that surprised it. */
  unexpected: number
  /** Consecutive surprises at the end of the history. */
  currentSurpriseStreak: number
  longestSurpriseStreak: number
  /** Consecutive correct predictions at the end of the history. */
  currentCorrectStreak: number
}

export function streakStats(predictions: PredictionRecord[]): StreakStats {
  let longest = 0
  let run = 0
  for (const p of predictions) {
    run = p.correct ? 0 : run + 1
    longest = Math.max(longest, run)
  }
  let currentCorrect = 0
  for (let i = predictions.length - 1; i >= 0 && predictions[i].correct; i--) currentCorrect++
  return {
    unexpected: predictions.filter((p) => !p.correct).length,
    currentSurpriseStreak: run,
    longestSurpriseStreak: longest,
    currentCorrectStreak: currentCorrect,
  }
}

/** Running accuracy after each prediction, for the trend chart. */
export function accuracyTrend(predictions: PredictionRecord[]): { round: number; accuracy: number }[] {
  let correct = 0
  return predictions.map((p, i) => {
    if (p.correct) correct++
    return { round: i + 1, accuracy: Math.round((correct / (i + 1)) * 100) }
  })
}
