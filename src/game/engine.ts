/**
 * THE PREDICTION ENGINE (v2 — the game)
 *
 * The protocol, enforced by the shape of these functions:
 *
 *   1. makePrediction(round, history)   ← history = rounds BEFORE this one only
 *   2. the prediction is locked: a SHA-256 code is shown before choosing
 *   3. the player chooses
 *   4. scoreRound() compares the locked prediction with the choice
 *   5. accuracy updates
 *   6. learning: each signal's trust is recomputed from its track record
 *   7. the next prediction uses the new history
 *
 * makePrediction never receives the current choice, so it cannot use it.
 *
 * How the blend works (a standard "mixture of experts" with online weights):
 *   • Each signal in experts.ts gives a probability for every option.
 *   • Each signal has a track record: on earlier rounds, how much probability did
 *     it give the option you actually chose, compared with random guessing?
 *   • Signals with better track records get more weight: weight = e^(4 × skill).
 *   • The blended probabilities decide the prediction; the top one is the pick.
 */
import { hashToUnit, seededRandom } from '../utils/random'
import { EXPERTS, getExpert } from './experts'
import { sha256 } from './sha256'
import type { ExpertVote, LockedPrediction, RoundRecord, RoundSpec } from './types'

export const MODEL_ID = 'signal-blend-v2'

/** How strongly track record changes trust. Higher = learns faster, but jumpier. */
const LEARNING_RATE = 4
/** A little probability is always kept on every option, so the model never claims certainty. */
const UNCERTAINTY_FLOOR = 0.06

/* ───────────── Display order ───────────── */

/** Seeded shuffle: the same run + round always shows options in the same order. */
export function displayOrderFor(round: RoundSpec, runId: string): string[] {
  const order = round.options.map((o) => o.id)
  if (!round.shuffle) return order
  const rand = seededRandom(Math.floor(hashToUnit(`${runId}:${round.id}:order`) * 2 ** 32))
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return order
}

/* ───────────── Learning: trust from track record ───────────── */

export interface TrackRecord {
  /** Sum over scored rounds of ln(p(choice)) − ln(1/k): positive = better than random. */
  gain: number
  /** Rounds this signal voted on and the player answered. */
  rounds: number
  /** Rounds where this signal's own top pick matched the choice. */
  hits: number
}

export function trackRecords(history: RoundRecord[]): Record<string, TrackRecord> {
  const records: Record<string, TrackRecord> = {}
  for (const r of history) {
    if (r.status !== 'answered' || r.choice === null) continue
    const k = r.displayOrder.length
    for (const vote of r.prediction.votes) {
      const rec = (records[vote.expertId] ??= { gain: 0, rounds: 0, hits: 0 })
      const p = Math.max(vote.probs[r.choice] ?? 0, 1e-6)
      rec.gain += Math.log(p) - Math.log(1 / k)
      rec.rounds += 1
      if (hasPreference(vote.probs) && topPick(vote.probs) === r.choice) rec.hits += 1
    }
  }
  return records
}

/** Raw weight of a signal given its track record. New signals start at 1. */
export function weightFrom(record: TrackRecord | undefined): number {
  if (!record) return 1
  const skill = record.gain / (record.rounds + 2) // +2 = be cautious with little data
  return Math.exp(LEARNING_RATE * skill)
}

/* ───────────── Prediction ───────────── */

/** false when a signal gave every option the same probability (no opinion). */
export function hasPreference(probs: Record<string, number>): boolean {
  const values = Object.values(probs)
  return Math.max(...values) - Math.min(...values) > 1e-9
}

export function topPick(probs: Record<string, number>, tieSeed = ''): string {
  return Object.entries(probs).sort((a, b) => b[1] - a[1] || hashToUnit(tieSeed + a[0]) - hashToUnit(tieSeed + b[0]))[0][0]
}

export function commitmentText(runId: string, roundId: string, optionId: string, salt: string): string {
  return `THA|${runId}|${roundId}|${optionId}|${salt}`
}

export function randomSalt(): string {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Make and lock the prediction for `round`.
 * @param history earlier rounds only. Anything else is filtered out defensively.
 */
export function makePrediction(
  round: RoundSpec,
  history: RoundRecord[],
  runId: string,
  displayOrder: string[],
  salt: string = randomSalt(),
  now: Date = new Date(),
): LockedPrediction {
  const earlier = history.filter((r) => r.roundId !== round.id && r.status === 'answered')
  const records = trackRecords(earlier)
  const optionIds = round.options.map((o) => o.id)
  const k = optionIds.length

  const votes: ExpertVote[] = []
  for (const expert of EXPERTS) {
    const out = expert.predict({ round, displayOrder, history: earlier, runId })
    if (!out) continue
    // Make sure every option has a probability and they sum to 1.
    const total = optionIds.reduce((s, id) => s + (out.probs[id] ?? 0), 0)
    const probs = Object.fromEntries(optionIds.map((id) => [id, total > 0 ? (out.probs[id] ?? 0) / total : 1 / k]))
    votes.push({ expertId: expert.id, probs, reason: out.reason, weight: weightFrom(records[expert.id]) })
  }

  // Blend.
  const totalWeight = votes.reduce((s, v) => s + v.weight, 0)
  const blended: Record<string, number> = {}
  for (const id of optionIds) {
    const mix = totalWeight > 0 ? votes.reduce((s, v) => s + v.weight * v.probs[id], 0) / totalWeight : 1 / k
    blended[id] = (1 - UNCERTAINTY_FLOOR) * mix + UNCERTAINTY_FLOOR / k
  }

  const optionId = topPick(blended, `${runId}:${round.id}`)

  // The signal that pushed hardest toward the pick explains it.
  const lead = votes
    .map((v) => ({ v, push: v.weight * (v.probs[optionId] - 1 / k) }))
    .sort((a, b) => b.push - a.push)[0]
  const leadVote = lead && lead.push > 0 ? lead.v : undefined
  const reason = leadVote
    ? leadVote.reason
    : votes.length === 1
      ? votes[0].reason // a single signal with no clear preference explains itself
      : `None of my signals pointed clearly anywhere, so this was close to a 1-in-${k} guess.`

  const commitment = sha256(commitmentText(runId, round.id, optionId, salt))

  return {
    optionId,
    confidence: blended[optionId],
    probs: blended,
    reason,
    leadExpertId: leadVote?.expertId ?? 'none',
    votes,
    commitment,
    salt,
    lockedAt: now.toISOString(),
    modelId: MODEL_ID,
  }
}

/** Re-hash a revealed prediction and check it matches the code shown before the choice. */
export function verifyLock(runId: string, record: RoundRecord): boolean {
  const p = record.prediction
  return sha256(commitmentText(runId, record.roundId, p.optionId, p.salt)) === p.commitment
}

/** Short, readable form of the lock code: "3f9a·c2d1·77e0". */
export function shortCode(commitment: string): string {
  return commitment.slice(0, 12).match(/.{4}/g)!.join('·')
}

/* ───────────── After the choice ───────────── */

/** Apply the player's choice to a locked round. Returns a new record. */
export function scoreRound(record: RoundRecord, choice: string | null, responseMs: number, now: Date = new Date()): RoundRecord {
  if (record.status !== 'locked') return record // a round can only be answered once
  if (choice !== null && !record.displayOrder.includes(choice)) return record // not an option in this round
  if (choice === null) {
    return { ...record, status: 'timeout', choice: null, chosenAt: now.toISOString(), responseMs, correct: null }
  }
  return {
    ...record,
    status: 'answered',
    choice,
    chosenAt: now.toISOString(),
    responseMs,
    correct: record.prediction.optionId === choice,
  }
}

export interface LearningLine {
  expertId: string
  name: string
  /** The option this signal favored ('' = no preference). */
  pick: string
  hit: boolean
  /** Share of total trust among this round's signals, before and after the round (0–1). */
  trustBefore: number
  trustAfter: number
}

/** What the engine learned from one answered round. */
export function learningFrom(record: RoundRecord, historyIncludingRecord: RoundRecord[]): LearningLine[] {
  if (record.choice === null) return []
  const after = trackRecords(historyIncludingRecord)
  const votes = record.prediction.votes
  const beforeTotal = votes.reduce((s, v) => s + v.weight, 0)
  const afterWeights = votes.map((v) => weightFrom(after[v.expertId]))
  const afterTotal = afterWeights.reduce((a, b) => a + b, 0)
  return votes.map((v, i) => ({
    expertId: v.expertId,
    name: getExpert(v.expertId)?.name ?? v.expertId,
    pick: hasPreference(v.probs) ? topPick(v.probs) : '',
    hit: hasPreference(v.probs) && topPick(v.probs) === record.choice,
    trustBefore: beforeTotal ? v.weight / beforeTotal : 0,
    trustAfter: afterTotal ? afterWeights[i] / afterTotal : 0,
  }))
}
