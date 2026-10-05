/**
 * THE SIGNALS ("experts")
 *
 * Each expert is a small, transparent rule that looks ONLY at earlier rounds
 * and returns a probability for every option, plus a sentence explaining why.
 * The engine (engine.ts) blends them, trusting the ones that have been right
 * for this player more often.
 *
 * Rules for writing an expert:
 *   • Never look at the current round's choice — you are not given it.
 *   • Describe observable behavior ("you switched 4 of 5 times"),
 *     never personality ("you are impulsive").
 *   • Return null when you have nothing to say yet.
 */
import { getScenario } from '../data/scenarios'
import { activeModel } from '../logic/prediction'
import type { ResponseRecord } from '../types'
import { getRound, KIND_NOUN } from './levels'
import type { RoundRecord, RoundSpec } from './types'

export interface ExpertContext {
  round: RoundSpec
  displayOrder: string[]
  /** Answered rounds before this one, oldest first. Never includes the current round. */
  history: RoundRecord[]
  runId: string
}

export interface ExpertOutput {
  probs: Record<string, number>
  reason: string
}

export interface Expert {
  id: string
  /** Short name shown in the UI, e.g. "Switching pattern". */
  name: string
  /** One line explaining what the signal looks at. */
  description: string
  predict(ctx: ExpertContext): ExpertOutput | null
}

/* ───────────── helpers ───────────── */

const ids = (round: RoundSpec) => round.options.map((o) => o.id)

function normalize(weights: Record<string, number>): Record<string, number> {
  const total = Object.values(weights).reduce((a, b) => a + b, 0)
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(weights)) out[k] = total > 0 ? v / total : 0
  return out
}

function uniform(round: RoundSpec): Record<string, number> {
  return normalize(Object.fromEntries(ids(round).map((id) => [id, 1])))
}

function argmax(probs: Record<string, number>): string {
  return Object.entries(probs).sort((a, b) => b[1] - a[1])[0][0]
}

/** Label of an option id, looked up in the current round. */
function label(round: RoundSpec, id: string): string {
  return round.options.find((o) => o.id === id)?.label.replace(/^[^A-Za-z0-9₹]+\s*/, '') ?? id
}

/** Earlier choices in the same mini-game, oldest first. */
function sameKindChoices(ctx: ExpertContext): string[] {
  return ctx.history.filter((r) => r.kind === ctx.round.kind && r.choice !== null).map((r) => r.choice!)
}

const times = (n: number) => `${n} ${n === 1 ? 'time' : 'times'}`
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

/* ───────────── 1. Opening guess ───────────── */

const OPENING_NUMBER: Record<string, number> = { '1': 2, '2': 4, '3': 9, '4': 7, '5': 7, '6': 7, '7': 16, '8': 8, '9': 6, '10': 3 }

export const openingGuess: Expert = {
  id: 'opening',
  name: 'Opening guess',
  description: 'A fixed starting assumption used before there is data about you.',
  predict({ round }) {
    switch (round.kind) {
      case 'number':
        return {
          probs: normalize(OPENING_NUMBER),
          reason: 'When people are asked for a number from 1 to 10, 7 is often reported as the most common pick, and the ends (1 and 10) are often avoided. That is my opening assumption.',
        }
      case 'pattern': {
        const obvious = round.obviousOptionId!
        const rest = ids(round).filter((id) => id !== obvious)
        return {
          probs: normalize({ [obvious]: 3, ...Object.fromEntries(rest.map((id) => [id, 1])) }),
          reason: `My opening assumption for sequence questions is the most obvious continuation: ${label(round, obvious)}.`,
        }
      }
      case 'dilemma':
        return null // handled by the trade-off model below
      default:
        return {
          probs: uniform(round),
          reason: `I had no data on your ${KIND_NOUN[round.kind]} choices yet, so this was a 1-in-${round.options.length} opening guess.`,
        }
    }
  },
}

/* ───────────── 2. Your favorite ───────────── */

export const favorite: Expert = {
  id: 'favorite',
  name: 'Your favorite',
  description: 'Which option you have picked most often in this mini-game.',
  predict(ctx) {
    if (!['color', 'number', 'direction'].includes(ctx.round.kind)) return null
    const past = sameKindChoices(ctx)
    if (past.length < 1) return null
    const counts: Record<string, number> = Object.fromEntries(ids(ctx.round).map((id) => [id, 0.5]))
    for (const c of past) if (c in counts) counts[c] += 1
    const probs = normalize(counts)
    const top = argmax(probs)
    const n = past.filter((c) => c === top).length
    const noun = KIND_NOUN[ctx.round.kind]
    return {
      probs,
      reason:
        past.length === 1
          ? `In your only earlier ${noun} round, you chose ${label(ctx.round, top)}.`
          : `You chose ${label(ctx.round, top)} ${times(n)} out of ${past.length} earlier ${noun} rounds.`,
    }
  },
}

/* ───────────── 3. Repeat or switch ───────────── */

export const repeatOrSwitch: Expert = {
  id: 'repeat',
  name: 'Repeat-or-switch habit',
  description: 'Whether you tend to repeat your previous pick or move away from it.',
  predict(ctx) {
    if (!['color', 'number', 'direction'].includes(ctx.round.kind)) return null
    const past = sameKindChoices(ctx)
    if (past.length < 2) return null
    let repeats = 0
    for (let i = 1; i < past.length; i++) if (past[i] === past[i - 1]) repeats++
    const transitions = past.length - 1
    const pRepeat = (repeats + 0.5) / (transitions + 1)
    const last = past[past.length - 1]
    const others = ids(ctx.round).filter((id) => id !== last)
    const probs: Record<string, number> = { [last]: pRepeat }
    for (const id of others) probs[id] = (1 - pRepeat) / others.length
    const noun = KIND_NOUN[ctx.round.kind]
    const reason =
      pRepeat >= 0.5
        ? `You repeated your previous ${noun} in ${repeats} of ${transitions} chances, and last time you picked ${label(ctx.round, last)}.`
        : `You switched away from your previous ${noun} in ${transitions - repeats} of ${transitions} chances. Last time you picked ${label(ctx.round, last)}, so I expected a switch.`
    return { probs, reason }
  },
}

/* ───────────── 4. Sequence memory ───────────── */

export const sequenceMemory: Expert = {
  id: 'sequence',
  name: 'Sequence memory',
  description: 'What you did next the last times the same moves came up.',
  predict(ctx) {
    if (!['color', 'direction'].includes(ctx.round.kind)) return null
    const s = sameKindChoices(ctx)
    for (const order of [3, 2, 1]) {
      if (s.length <= order) continue
      const context = s.slice(-order)
      const next: Record<string, number> = {}
      let total = 0
      for (let i = order; i < s.length; i++) {
        const match = context.every((c, j) => s[i - order + j] === c)
        if (match) {
          next[s[i]] = (next[s[i]] ?? 0) + 1
          total++
        }
      }
      if (total < 2 && order > 1) continue // need repeated evidence for long contexts
      if (total === 0) continue
      const k = ctx.round.options.length
      const probs = normalize(Object.fromEntries(ids(ctx.round).map((id) => [id, (next[id] ?? 0) + 1 / k])))
      const top = argmax(probs)
      const path = context.map((c) => label(ctx.round, c)).join(' → ')
      return {
        probs,
        reason: `After ${path}, you went ${label(ctx.round, top)} ${next[top] ?? 0} of ${times(total)}.`,
      }
    }
    return null
  },
}

/* ───────────── 5. Balancing (contrarian) ───────────── */

export const balancing: Expert = {
  id: 'balance',
  name: 'Balancing',
  description: 'People trying to look random often move to the option they have used least.',
  predict(ctx) {
    if (!['color', 'number', 'direction'].includes(ctx.round.kind)) return null
    const past = sameKindChoices(ctx)
    if (past.length < 3) return null
    const counts: Record<string, number> = Object.fromEntries(ids(ctx.round).map((id) => [id, 0]))
    for (const c of past) if (c in counts) counts[c] += 1
    const weights = Object.fromEntries(Object.entries(counts).map(([id, c]) => [id, 1 / (c + 1) ** 2]))
    const probs = normalize(weights)
    const top = argmax(probs)
    return {
      probs,
      reason: `${label(ctx.round, top)} is the option you have used least (${counts[top]} of ${past.length}). Balancing your picks would point there.`,
    }
  },
}

/* ───────────── 6. Screen position ───────────── */

const POSITION_NAMES: Record<number, string[]> = {
  3: ['left', 'middle', 'right'],
  4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
}

export const screenPosition: Expert = {
  id: 'position',
  name: 'Screen position',
  description: 'Where on the screen your picks were, when the order was shuffled.',
  predict(ctx) {
    if (!ctx.round.shuffle) return null
    const k = ctx.round.options.length
    const past = ctx.history.filter((r) => r.choice !== null && getRound(r.roundId)?.shuffle && r.displayOrder.length === k)
    if (past.length < 2) return null
    const counts = new Array(k).fill(0.5)
    for (const r of past) counts[r.displayOrder.indexOf(r.choice!)] += 1
    const probs = normalize(Object.fromEntries(ctx.displayOrder.map((id, pos) => [id, counts[pos]])))
    const topPos = counts.indexOf(Math.max(...counts))
    const name = POSITION_NAMES[k]?.[topPos] ?? `#${topPos + 1}`
    return {
      probs,
      reason: `In shuffled rounds, you picked the ${name} option ${times(Math.round(counts[topPos] - 0.5))} out of ${past.length}. This round, that spot held ${label(ctx.round, ctx.displayOrder[topPos])}.`,
    }
  },
}

/* ───────────── 7. Obvious answer ───────────── */

export const obviousAnswer: Expert = {
  id: 'obvious',
  name: 'Obvious-answer habit',
  description: 'Whether you pick the most obvious continuation in sequence questions.',
  predict(ctx) {
    if (ctx.round.kind !== 'pattern') return null
    const past = ctx.history.filter((r) => r.kind === 'pattern' && r.choice !== null)
    if (past.length < 1) return null
    const obviousPicks = past.filter((r) => r.choice === getRound(r.roundId)?.obviousOptionId).length
    const p = (obviousPicks + 1) / (past.length + 2)
    const obvious = ctx.round.obviousOptionId!
    const rest = ids(ctx.round).filter((id) => id !== obvious)
    const probs: Record<string, number> = { [obvious]: p }
    for (const id of rest) probs[id] = (1 - p) / rest.length
    return {
      probs,
      reason:
        p >= 0.5
          ? `You picked the most obvious continuation in ${obviousPicks} of ${plural(past.length, 'earlier sequence')}.`
          : `You avoided the most obvious continuation in ${past.length - obviousPicks} of ${plural(past.length, 'earlier sequence')}.`,
    }
  },
}

/* ───────────── 8. Trade-off model (the original 25-scenario model) ───────────── */

export const tradeoffModel: Expert = {
  id: 'tradeoff',
  name: 'Trade-off profile',
  description: 'How you traded money, time and risk in earlier dilemmas (the original rule-based model).',
  predict(ctx) {
    if (ctx.round.kind !== 'dilemma' || !ctx.round.scenarioId) return null
    const scenario = getScenario(ctx.round.scenarioId)
    if (!scenario) return null
    // Convert earlier dilemma rounds into the response format the original model expects.
    const responses: ResponseRecord[] = ctx.history
      .filter((r) => r.kind === 'dilemma' && r.choice !== null)
      .flatMap((r) => {
        const s = getScenario(getRound(r.roundId)?.scenarioId ?? '')
        const chosen = s?.options.find((o) => o.id === r.choice)
        if (!s || !chosen) return []
        return [{
          sessionId: ctx.runId,
          scenarioId: s.id,
          category: s.category,
          selectedOption: r.choice as 'A' | 'B',
          responseTimeMs: r.responseMs ?? 0,
          timestamp: r.chosenAt ?? '',
          signals: chosen.effects,
        }]
      })
    const p = activeModel.predict(scenario, responses, ctx.runId)
    const other = p.optionId === 'A' ? 'B' : 'A'
    return { probs: { [p.optionId]: p.confidence, [other]: 1 - p.confidence }, reason: p.reasoning }
  },
}

export const EXPERTS: Expert[] = [
  openingGuess,
  favorite,
  repeatOrSwitch,
  sequenceMemory,
  balancing,
  screenPosition,
  obviousAnswer,
  tradeoffModel,
]

export function getExpert(id: string): Expert | undefined {
  return EXPERTS.find((e) => e.id === id)
}
