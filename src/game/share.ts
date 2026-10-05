/**
 * SHARING & FRIEND CHALLENGES
 *
 * There is no server, so there is no global leaderboard. Instead:
 *   • a result card you can copy, share, or save as an image
 *   • a challenge link that carries your duel score to a friend
 *     (the link is plain text, so the friend's page labels it "shared, not verified")
 */
import { roundsInLevel, TOTAL_ROUNDS } from './levels'
import { mostCommonTendency } from './report'
import { duel, score } from './stats'
import type { ChallengeInfo, GameRun } from './types'

const DUEL_ROUNDS = roundsInLevel(4).length

export interface ShareSummary {
  correct: number
  scored: number
  accuracy: number
  fooled: number
  tendency: string
  duelAlgorithm: number
  duelHuman: number
  outcome: ReturnType<typeof duel>['outcome']
}

export function summarize(run: GameRun): ShareSummary {
  const s = score(run.rounds)
  const d = duel(run.rounds, DUEL_ROUNDS)
  return {
    correct: s.correct,
    scored: s.scored,
    accuracy: Math.round((s.accuracy ?? 0) * 100),
    fooled: s.fooled,
    tendency: mostCommonTendency(run.rounds).label,
    duelAlgorithm: d.algorithm,
    duelHuman: d.human,
    outcome: d.outcome,
  }
}

export function outcomeLine(outcome: ShareSummary['outcome']): string {
  if (outcome === 'human') return 'I BEAT THE ALGORITHM.'
  if (outcome === 'algorithm') return 'The algorithm beat me.'
  if (outcome === 'draw') return 'The duel ended in a draw.'
  return 'Duel not finished.'
}

/** Base address of the site, correct on GitHub Pages and locally. */
function siteUrl(): string {
  return `${window.location.origin}${window.location.pathname}`
}

export function challengeLink(run: GameRun): string {
  const s = summarize(run)
  return `${siteUrl()}#/experiment?vs=${s.duelHuman}-${s.duelAlgorithm + s.duelHuman}-${s.accuracy}`
}

/** Reads "?vs=4-10-62" → { fooled: 4, duel: 10, accuracy: 62 }. Rejects anything malformed. */
export function parseChallenge(search: string): ChallengeInfo | undefined {
  const raw = new URLSearchParams(search).get('vs')
  const m = raw?.match(/^(\d{1,2})-(\d{1,2})-(\d{1,3})$/)
  if (!m) return undefined
  const [fooled, duelRounds, accuracy] = m.slice(1).map(Number)
  if (duelRounds < 1 || duelRounds > DUEL_ROUNDS || fooled > duelRounds || accuracy > 100) return undefined
  return { fooled, duel: duelRounds, accuracy }
}

export function shareText(run: GameRun): string {
  const s = summarize(run)
  return [
    'THE HUMAN ALGORITHM',
    '',
    `🤖 The algorithm predicted ${s.correct}/${s.scored} of my moves (${s.accuracy}%)`,
    `🔥 I fooled it ${s.duelHuman}/${s.duelAlgorithm + s.duelHuman} times in the final duel`,
    `🧠 My strongest tendency: ${s.tendency}`,
    outcomeLine(s.outcome),
    '',
    'Think you’re less predictable? Can you beat it?',
    challengeLink(run),
  ].join('\n')
}

/* ───────────── Result image (for Instagram stories, chats, etc.) ───────────── */

/** Draws the result card to a 1080×1350 PNG. */
export async function renderResultImage(run: GameRun): Promise<Blob | null> {
  const s = summarize(run)
  const W = 1080
  const H = 1350
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  try {
    await document.fonts?.ready
  } catch {
    /* fonts are optional */
  }

  const INK = '#edede9'
  const MUTED = '#8c8c86'
  const SIGNAL = '#ff6a3d'
  const HUMAN = '#7aa7ff'
  const display = '"Inter Tight", Inter, system-ui, sans-serif'
  const mono = '"JetBrains Mono", ui-monospace, monospace'

  ctx.fillStyle = '#0b0b0c'
  ctx.fillRect(0, 0, W, H)
  // hairline grid
  ctx.strokeStyle = 'rgba(255,255,255,0.04)'
  ctx.lineWidth = 1
  for (let x = 0; x <= W; x += 60) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, H)
    ctx.stroke()
  }
  for (let y = 0; y <= H; y += 60) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(W, y)
    ctx.stroke()
  }

  const left = 90
  ctx.fillStyle = MUTED
  ctx.font = `500 28px ${mono}`
  ctx.fillText('THE HUMAN ALGORITHM', left, 140)
  ctx.fillStyle = SIGNAL
  ctx.fillRect(left, 170, 80, 4)

  ctx.fillStyle = INK
  ctx.font = `600 92px ${display}`
  const headline =
    s.outcome === 'human' ? ['I beat the', 'algorithm.'] : s.outcome === 'algorithm' ? ['The algorithm', 'beat me.'] : s.outcome === 'draw' ? ['Dead heat.', ''] : ['Human vs', 'Algorithm.']
  ctx.fillText(headline[0], left, 320)
  ctx.fillText(headline[1], left, 420)

  const row = (y: number, labelText: string, value: string, color: string) => {
    ctx.fillStyle = MUTED
    ctx.font = `500 26px ${mono}`
    ctx.fillText(labelText.toUpperCase(), left, y)
    ctx.fillStyle = color
    ctx.font = `600 84px ${display}`
    ctx.fillText(value, left, y + 92)
  }
  row(560, 'Algorithm accuracy', `${s.accuracy}%  ·  ${s.correct}/${s.scored}`, SIGNAL)
  row(760, 'Times I fooled it in the duel', `${s.duelHuman} / ${s.duelAlgorithm + s.duelHuman}`, HUMAN)
  row(960, 'My strongest tendency', s.tendency, INK)

  ctx.fillStyle = INK
  ctx.font = `600 52px ${display}`
  ctx.fillText('Can you beat it?', left, 1200)
  ctx.fillStyle = MUTED
  ctx.font = `400 26px ${mono}`
  ctx.fillText(`${TOTAL_ROUNDS} rounds · predictions locked before every move`, left, 1250)

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'))
}
