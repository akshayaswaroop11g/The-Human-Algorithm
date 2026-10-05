/**
 * Tests for the game engine. Run with:  npm test
 *
 * The most important property: a prediction can never depend on the choice it predicts.
 */
import { describe, expect, it } from 'vitest'
import { displayOrderFor, makePrediction, scoreRound, verifyLock, commitmentText } from './engine'
import { ROUNDS } from './levels'
import { sha256 } from './sha256'
import { chanceOfAtLeast, duel, score } from './stats'
import type { RoundRecord } from './types'
import { seededRandom } from '../utils/random'

/** Plays a whole game with a strategy function. Mirrors exactly what the UI does. */
function play(strategy: (roundIndex: number, options: string[], history: RoundRecord[]) => string, runId = 'TEST-RUN') {
  const history: RoundRecord[] = []
  ROUNDS.forEach((round, i) => {
    const order = displayOrderFor(round, runId)
    // 1. predict from earlier rounds only, 2. lock
    const prediction = makePrediction(round, history, runId, order, `salt${i}`)
    const locked: RoundRecord = {
      roundId: round.id, level: round.level, kind: round.kind, displayOrder: order,
      prediction, status: 'locked', choice: null, correct: null,
    }
    // 3. choose, 4–5. compare and score
    const choice = strategy(i, order, history)
    history.push(scoreRound(locked, choice, 1000))
  })
  return history
}

describe('sha256', () => {
  it('matches known test vectors', () => {
    expect(sha256('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
    expect(sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
    expect(sha256('THA|₹1,000')).toHaveLength(64)
  })
})

describe('prediction protocol', () => {
  it('never changes based on the choice it is predicting', () => {
    const base = play((i, opts) => opts[i % opts.length])
    // Re-run each round's prediction with the SAME earlier history but every possible current choice.
    ROUNDS.forEach((round, i) => {
      const earlier = base.slice(0, i)
      const order = base[i].displayOrder
      const reference = makePrediction(round, earlier, 'TEST-RUN', order, 'x').optionId
      for (const option of round.options) {
        const withFutureChoice = [...earlier, { ...base[i], choice: option.id, status: 'answered' as const }]
        // Even if a record for this round sneaks into history, it must be ignored.
        expect(makePrediction(round, withFutureChoice, 'TEST-RUN', order, 'x').optionId).toBe(reference)
      }
    })
  })

  it('locks every prediction with a verifiable SHA-256 code', () => {
    const rounds = play((_, opts) => opts[0])
    for (const r of rounds) {
      expect(verifyLock('TEST-RUN', r)).toBe(true)
      expect(r.prediction.commitment).toBe(sha256(commitmentText('TEST-RUN', r.roundId, r.prediction.optionId, r.prediction.salt)))
      // Tampering with the revealed prediction breaks the lock.
      const other = r.displayOrder.find((id) => id !== r.prediction.optionId)!
      expect(verifyLock('TEST-RUN', { ...r, prediction: { ...r.prediction, optionId: other } })).toBe(false)
    }
  })

  it('a round can only be answered once, and only with a real option', () => {
    const [first] = play((_, opts) => opts[0])
    expect(scoreRound(first, first.displayOrder[1], 10)).toBe(first)
    const locked: RoundRecord = { ...first, status: 'locked', choice: null, correct: null }
    expect(scoreRound(locked, 'not-an-option', 10)).toBe(locked)
  })

  it('timeouts count for neither side', () => {
    const rounds = play((_, opts) => opts[0]).map((r, i) => (i === 0 ? { ...r, status: 'timeout' as const, choice: null, correct: null } : r))
    const s = score(rounds)
    expect(s.timeouts).toBe(1)
    expect(s.scored).toBe(rounds.length - 1)
    expect(s.correct + s.fooled).toBe(s.scored)
  })
})

describe('scoring is honest', () => {
  it('counts exactly what happened', () => {
    const rounds = play((i, opts) => opts[(i * 7) % opts.length])
    const s = score(rounds)
    expect(s.correct).toBe(rounds.filter((r) => r.choice === r.prediction.optionId).length)
  })

  it('random baseline sums 1/k per round', () => {
    const rounds = play((_, opts) => opts[0])
    const expected = rounds.reduce((sum, r) => sum + 1 / r.displayOrder.length, 0)
    expect(score(rounds).randomExpected).toBeCloseTo(expected)
  })

  it('luck probability matches a simple binomial case', () => {
    // 10 coin flips, at least 8 right: (45 + 10 + 1) / 1024
    expect(chanceOfAtLeast(new Array(10).fill(0.5), 8)).toBeCloseTo(56 / 1024)
    expect(chanceOfAtLeast([0.25, 0.25], 0)).toBe(1)
  })

  it('duel winner is whoever has more points', () => {
    const rounds = play((_, opts) => opts[0])
    const d = duel(rounds, 10)
    expect(d.algorithm + d.human).toBe(d.scored)
    expect(d.outcome).toBe(d.algorithm > d.human ? 'algorithm' : d.algorithm < d.human ? 'human' : 'draw')
  })
})

describe('the engine learns real patterns', () => {
  it('beats chance against a strict alternator', () => {
    let last = 'right'
    const rounds = play((_, opts) => {
      if (opts.includes('left')) {
        last = last === 'left' ? 'right' : 'left'
        return last
      }
      return opts[0]
    })
    const duelRounds = rounds.filter((r) => r.level === 4)
    expect(score(duelRounds).correct).toBeGreaterThanOrEqual(8)
  })

  it('does not beat chance much against a truly random player', () => {
    let total = 0
    let expected = 0
    for (let seed = 1; seed <= 40; seed++) {
      const rand = seededRandom(seed)
      const rounds = play((_, opts) => opts[Math.floor(rand() * opts.length)], `R${seed}`)
      const s = score(rounds)
      total += s.correct
      expected += s.randomExpected
    }
    // Within ~15% of the random expectation over 40 random games.
    expect(total / expected).toBeGreaterThan(0.8)
    expect(total / expected).toBeLessThan(1.2)
  })
})
