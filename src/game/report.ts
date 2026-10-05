/**
 * THE BEHAVIORAL REPORT ("Your human pattern")
 *
 * Every sentence is computed from the rounds actually played. Each observation
 * checks it has enough data before saying anything. Wording describes what
 * happened in this experiment ("During this experiment, you…"), never who
 * someone is.
 */
import { getScenario } from '../data/scenarios'
import { median } from '../utils/random'
import { trackRecords } from './engine'
import { getExpert } from './experts'
import { getRound } from './levels'
import { score } from './stats'
import type { RoundRecord } from './types'

export interface Observation {
  id: string
  tag: string
  text: string
  /** 0–1, used to rank. */
  strength: number
}

const answered = (rounds: RoundRecord[]) => rounds.filter((r) => r.status === 'answered' && r.choice !== null)
const choicesOf = (rounds: RoundRecord[], kind: RoundRecord['kind']) => answered(rounds).filter((r) => r.kind === kind).map((r) => r.choice!)
const pct = (n: number) => `${Math.round(n * 100)}%`
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/* ───────────── Direction (the richest data) ───────────── */

export function directionStats(rounds: RoundRecord[]) {
  const seq = choicesOf(rounds, 'direction')
  let switches = 0
  let longestRun = seq.length ? 1 : 0
  let run = 1
  for (let i = 1; i < seq.length; i++) {
    if (seq[i] !== seq[i - 1]) {
      switches++
      run = 1
    } else {
      run++
      longestRun = Math.max(longestRun, run)
    }
  }
  const transitions = Math.max(seq.length - 1, 0)
  return {
    moves: seq.length,
    transitions,
    switches,
    switchRate: transitions ? switches / transitions : null,
    longestRun,
    rights: seq.filter((c) => c === 'right').length,
  }
}

/* ───────────── Tendency + strongest pattern ───────────── */

export interface Tendency {
  label: string
  detail: string
}

export function mostCommonTendency(rounds: RoundRecord[]): Tendency {
  const d = directionStats(rounds)
  if (d.switchRate !== null && d.transitions >= 5) {
    if (d.switchRate >= 0.65) return { label: 'Alternation', detail: `You switched direction in ${d.switches} of ${d.transitions} moves.` }
    if (d.switchRate <= 0.35) return { label: 'Repetition', detail: `You repeated your previous direction in ${d.transitions - d.switches} of ${d.transitions} moves.` }
  }
  const colors = choicesOf(rounds, 'color')
  if (colors.length >= 3) {
    const counts = countBy(colors)
    const [top, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    if (n / colors.length >= 0.6) return { label: 'A favorite', detail: `You chose ${cap(top)} in ${n} of ${colors.length} color rounds.` }
    if (Object.keys(counts).length === colors.length) return { label: 'Variety', detail: `You chose a different color every time (${colors.length} of ${colors.length}).` }
  }
  if (d.switchRate !== null && d.transitions >= 5) {
    return { label: 'Balance', detail: `You switched direction in ${d.switches} of ${d.transitions} moves — close to what a coin would do.` }
  }
  return { label: 'Mixed', detail: 'No single habit dominated your choices.' }
}

export interface StrongestPattern {
  expertId: string
  name: string
  text: string
  hits: number
  rounds: number
}

/** The signal with the best track record against this player. */
export function strongestPattern(rounds: RoundRecord[]): StrongestPattern | null {
  const records = trackRecords(rounds)
  const ranked = Object.entries(records)
    .filter(([id, r]) => id !== 'opening' && r.rounds >= 3 && r.hits >= 2)
    .map(([id, r]) => ({ id, r, skill: r.gain / (r.rounds + 2) }))
    .sort((a, b) => b.skill - a.skill)
  const best = ranked[0]
  if (!best || best.skill <= 0) return null
  const expert = getExpert(best.id)!
  return {
    expertId: best.id,
    name: expert.name,
    text: `${expert.description} This signal's own pick matched your choice in ${best.r.hits} of ${best.r.rounds} rounds.`,
    hits: best.r.hits,
    rounds: best.r.rounds,
  }
}

/* ───────────── Observations ───────────── */

function countBy(values: string[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const v of values) out[v] = (out[v] ?? 0) + 1
  return out
}

/** Pairs of dilemmas that test the same trade-off. */
const DILEMMA_PAIRS: { a: string; b: string; topic: string }[] = [
  { a: 's01', b: 's13', topic: 'getting money now versus more money later' },
  { a: 's04', b: 's25', topic: 'a guaranteed amount versus a gamble for more' },
]

export function observations(rounds: RoundRecord[]): Observation[] {
  const out: Observation[] = []
  const d = directionStats(rounds)

  // Switching
  if (d.switchRate !== null && d.transitions >= 6) {
    const lean = Math.abs(d.switchRate - 0.5) * 2
    out.push({
      id: 'switching',
      tag: 'Left / Right',
      strength: 0.4 + lean * 0.6,
      text: `During this experiment, you switched between Left and Right in ${d.switches} of ${d.transitions} moves (${pct(d.switchRate)}). A coin would switch about half the time.`,
    })
  }
  // Longest run
  if (d.moves >= 8) {
    out.push({
      id: 'run',
      tag: 'Streaks',
      strength: d.longestRun <= 2 ? 0.75 : d.longestRun >= 5 ? 0.65 : 0.3,
      text:
        d.longestRun <= 2
          ? `You never chose the same direction more than ${d.longestRun} times in a row in ${d.moves} moves. Truly random sequences of that length usually contain longer runs.`
          : `Your longest run of the same direction was ${d.longestRun} in a row, out of ${d.moves} moves.`,
    })
  }
  // Left/right balance
  if (d.moves >= 8) {
    const share = d.rights / d.moves
    if (share >= 0.65 || share <= 0.35) {
      const side = share >= 0.5 ? 'Right' : 'Left'
      const n = share >= 0.5 ? d.rights : d.moves - d.rights
      out.push({ id: 'side', tag: 'Left / Right', strength: Math.abs(share - 0.5) * 2, text: `You chose ${side} ${n} of ${d.moves} times.` })
    }
  }

  // Colors
  const colors = choicesOf(rounds, 'color')
  if (colors.length >= 3) {
    const counts = countBy(colors)
    const [top, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    if (Object.keys(counts).length === colors.length) {
      out.push({ id: 'colors', tag: 'Choice', strength: 0.45, text: `You picked a different color every time (${colors.length} rounds, ${colors.length} colors).` })
    } else if (n >= 2) {
      out.push({ id: 'colors', tag: 'Choice', strength: (n / colors.length) * 0.7, text: `You chose ${cap(top)} in ${n} of ${colors.length} color rounds.` })
    }
  }

  // Numbers
  const numbers = choicesOf(rounds, 'number')
  if (numbers.length >= 3) {
    const avoidedEnds = !numbers.includes('1') && !numbers.includes('10')
    out.push({
      id: 'numbers',
      tag: 'Number',
      strength: 0.3,
      text: `Your numbers were ${numbers.join(', ')}.${avoidedEnds ? ' You never picked 1 or 10.' : ''}`,
    })
  }

  // Patterns
  const patterns = answered(rounds).filter((r) => r.kind === 'pattern')
  if (patterns.length >= 2) {
    const obvious = patterns.filter((r) => r.choice === getRound(r.roundId)?.obviousOptionId).length
    out.push({
      id: 'patterns',
      tag: 'Pattern',
      strength: obvious === patterns.length || obvious === 0 ? 0.55 : 0.25,
      text: `You picked the most obvious continuation in ${obvious} of ${patterns.length} sequence questions.`,
    })
  }

  // Dilemma consistency
  for (const pair of DILEMMA_PAIRS) {
    const first = answered(rounds).find((r) => getRound(r.roundId)?.scenarioId === pair.a)
    const second = answered(rounds).find((r) => getRound(r.roundId)?.scenarioId === pair.b)
    if (!first || !second) continue
    const s1 = getScenario(pair.a)!
    const s2 = getScenario(pair.b)!
    const l1 = s1.options.find((o) => o.id === first.choice)!.label
    const l2 = s2.options.find((o) => o.id === second.choice)!.label
    out.push({
      id: `pair-${pair.a}`,
      tag: 'Dilemmas',
      strength: 0.5,
      text:
        first.choice === second.choice
          ? `When ${pair.topic} came up twice, you made the same kind of choice both times (“${l1}”, then “${l2}”).`
          : `When ${pair.topic} came up twice, you chose differently each time (“${l1}”, then “${l2}”).`,
    })
  }

  // Pressure (Level 3) vs Level 2 — only with enough rounds on both sides.
  const l2 = answered(rounds).filter((r) => r.level === 2)
  const l3 = answered(rounds).filter((r) => r.level === 3)
  if (l2.length >= 4 && l3.length >= 4) {
    const m2 = median(l2.map((r) => r.responseMs ?? 0))!
    const m3 = median(l3.map((r) => r.responseMs ?? 0))!
    const s2 = score(l2)
    const s3 = score(l3)
    const accDiff = (s3.accuracy ?? 0) - (s2.accuracy ?? 0)
    let text = `Under time pressure, you answered in a median of ${(m3 / 1000).toFixed(1)}s, compared with ${(m2 / 1000).toFixed(1)}s in Level 2.`
    if (Math.abs(accDiff) >= 0.25) {
      text += ` The algorithm predicted ${s3.correct} of ${s3.scored} pressure moves, compared with ${s2.correct} of ${s2.scored} in Level 2.`
    }
    out.push({ id: 'pressure', tag: 'Pressure', strength: 0.35 + Math.min(Math.abs(accDiff), 0.5), text })
  }

  // Trying to beat it (Level 4) vs before
  const before = score(rounds.filter((r) => r.level < 4))
  const duelScore = score(rounds.filter((r) => r.level === 4))
  if (before.scored >= 8 && duelScore.scored >= 6 && before.accuracy !== null && duelScore.accuracy !== null) {
    const diff = duelScore.accuracy - before.accuracy
    out.push({
      id: 'beat',
      tag: 'Beat mode',
      strength: 0.4 + Math.min(Math.abs(diff), 0.5),
      text: `While you were trying to beat it, the algorithm was right ${pct(duelScore.accuracy)} of the time (${duelScore.correct} of ${duelScore.scored}), compared with ${pct(before.accuracy)} in Levels 1–3. In Levels 1–3, a random guesser would expect about ${pct(before.randomRate ?? 0)}; in the duel, 50%.`,
    })
  }

  return out.sort((a, b) => b.strength - a.strength).slice(0, 6)
}
