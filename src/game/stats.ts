/**
 * SCORING & THE RANDOM BASELINE
 *
 * Everything here is plain counting. Nothing is adjusted to flatter the algorithm.
 *
 * Random baseline: a guesser picking uniformly at random is right 1/k of the time
 * in a round with k options (1/2 for Left/Right, 1/4 for colors, 1/10 for numbers…).
 * Because rounds have different numbers of options, the expected random score is
 * the SUM of 1/k over the scored rounds, not a single fixed percentage.
 */
import type { Level, RoundRecord } from './types'

export interface Score {
  /** Rounds that count: answered (timeouts and unanswered rounds don't). */
  scored: number
  correct: number
  /** Rounds where the player's choice differed from the prediction. */
  fooled: number
  timeouts: number
  /** correct / scored, or null with nothing scored. */
  accuracy: number | null
  /** Expected number of correct guesses for a random guesser. */
  randomExpected: number
  /** randomExpected / scored. */
  randomRate: number | null
  /** Probability that a random guesser would get at least `correct` right. */
  luckChance: number | null
}

export const scoredRounds = (rounds: RoundRecord[]) => rounds.filter((r) => r.status === 'answered')

export function score(rounds: RoundRecord[]): Score {
  const scored = scoredRounds(rounds)
  const correct = scored.filter((r) => r.correct).length
  const chances = scored.map((r) => 1 / r.displayOrder.length)
  const randomExpected = chances.reduce((a, b) => a + b, 0)
  return {
    scored: scored.length,
    correct,
    fooled: scored.length - correct,
    timeouts: rounds.filter((r) => r.status === 'timeout').length,
    accuracy: scored.length ? correct / scored.length : null,
    randomExpected,
    randomRate: scored.length ? randomExpected / scored.length : null,
    luckChance: scored.length ? chanceOfAtLeast(chances, correct) : null,
  }
}

/**
 * P(a random guesser gets at least `x` right), where round i is guessed
 * correctly with probability ps[i]. (Poisson-binomial tail, computed exactly.)
 */
export function chanceOfAtLeast(ps: number[], x: number): number {
  let dist = [1] // dist[j] = P(exactly j correct so far)
  for (const p of ps) {
    const next = new Array(dist.length + 1).fill(0)
    for (let j = 0; j < dist.length; j++) {
      next[j] += dist[j] * (1 - p)
      next[j + 1] += dist[j] * p
    }
    dist = next
  }
  return dist.slice(Math.max(0, x)).reduce((a, b) => a + b, 0)
}

export type Verdict = 'clearly-better' | 'somewhat-better' | 'no-better'

/** Is the algorithm actually better than guessing? Honest, plain-language verdict. */
export function verdict(s: Score): { kind: Verdict; headline: string; detail: string } {
  if (s.accuracy === null || s.randomRate === null || s.luckChance === null) {
    return { kind: 'no-better', headline: 'Not enough rounds to judge.', detail: 'Play more rounds to compare the algorithm with random guessing.' }
  }
  const pct = (n: number) => `${Math.round(n * 100)}%`
  if (s.luckChance < 0.05 && s.accuracy > s.randomRate) {
    return {
      kind: 'clearly-better',
      headline: 'The algorithm clearly beat random guessing.',
      detail: `A random guesser would score ${s.correct} or more ${s.luckChance < 0.001 ? 'less than 0.1%' : s.luckChance < 0.01 ? `about ${(s.luckChance * 100).toFixed(1)}%` : `only about ${pct(s.luckChance)}`} of the time. Your choices had patterns it could use.`,
    }
  }
  if (s.accuracy > s.randomRate) {
    return {
      kind: 'somewhat-better',
      headline: 'Better than random — but not by enough to rule out luck.',
      detail: `A random guesser would do this well about ${pct(s.luckChance)} of the time. This time, your choices were fairly hard to predict.`,
    }
  }
  return {
    kind: 'no-better',
    headline: 'The algorithm did no better than random guessing.',
    detail: 'This time, your choices were difficult to predict. The patterns it looked for weren’t there.',
  }
}

/** Score for one level. */
export const levelScore = (rounds: RoundRecord[], level: Level) => score(rounds.filter((r) => r.level === level))

export type DuelOutcome = 'algorithm' | 'human' | 'draw' | 'incomplete'

/** Level 4: algorithm points = correct predictions, human points = times fooled. */
export function duel(rounds: RoundRecord[], totalDuelRounds: number) {
  const duelRounds = rounds.filter((r) => r.level === 4)
  const s = score(duelRounds)
  const finished = duelRounds.filter((r) => r.status !== 'locked').length >= totalDuelRounds
  let outcome: DuelOutcome = 'incomplete'
  if (finished) outcome = s.correct > s.fooled ? 'algorithm' : s.correct < s.fooled ? 'human' : 'draw'
  return { algorithm: s.correct, human: s.fooled, scored: s.scored, timeouts: s.timeouts, outcome }
}

/** Running accuracy vs running random expectation, for the trend chart. */
export function runningAccuracy(rounds: RoundRecord[]) {
  let correct = 0
  let expected = 0
  return scoredRounds(rounds).map((r, i) => {
    if (r.correct) correct++
    expected += 1 / r.displayOrder.length
    return { round: i + 1, accuracy: Math.round((correct / (i + 1)) * 100), random: Math.round((expected / (i + 1)) * 100) }
  })
}
