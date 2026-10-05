/**
 * Visual identity for the two players.
 *   ALGORITHM — signal orange, square "aperture" mark, monospace voice.
 *   HUMAN     — cool blue, round mark.
 * Both always carry a text label, so color is never the only cue.
 */
import type { ReactNode } from 'react'
import { getRound } from '../../game/levels'
import type { GameOption, RoundSpec } from '../../game/types'

export function AlgorithmMark({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" fill="none" stroke="var(--color-signal)" strokeWidth="1.6" />
      <rect x="9" y="9" width="6" height="6" fill="var(--color-signal)" />
      <path d="M3 9h3M18 9h3M3 15h3M18 15h3" stroke="var(--color-signal)" strokeWidth="1.6" />
    </svg>
  )
}

export function HumanMark({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="8.5" r="4" fill="none" stroke="var(--color-human)" strokeWidth="1.6" />
      <path d="M4.5 21c1.2-4 4-6 7.5-6s6.3 2 7.5 6" fill="none" stroke="var(--color-human)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function AgentLabel({ who, children, compact = false }: { who: 'algorithm' | 'human'; children?: ReactNode; compact?: boolean }) {
  const size = compact ? 'gap-1.5 text-[0.62rem] tracking-[0.08em] sm:gap-2 sm:text-[0.72rem] sm:tracking-[0.16em]' : 'gap-2 text-[0.72rem] tracking-[0.16em]'
  return (
    <span className={`inline-flex items-center whitespace-nowrap font-mono uppercase ${size} ${who === 'algorithm' ? 'text-signal' : 'text-human'}`}>
      {who === 'algorithm' ? <AlgorithmMark className="h-4 w-4" /> : <HumanMark className="h-4 w-4" />}
      {children ?? (who === 'algorithm' ? 'Algorithm' : 'You')}
    </span>
  )
}

/** Small swatch + shape for color options (shape keeps it readable without color). */
export function Swatch({ option, size = 18 }: { option: GameOption; size?: number }) {
  if (!option.swatch) return null
  const s = size
  const fill = option.swatch
  return (
    <svg width={s} height={s} viewBox="0 0 20 20" aria-hidden="true" className="shrink-0">
      {option.shape === 'circle' && <circle cx="10" cy="10" r="8" fill={fill} />}
      {option.shape === 'square' && <rect x="2.5" y="2.5" width="15" height="15" fill={fill} />}
      {option.shape === 'triangle' && <path d="M10 2 18.5 17.5H1.5Z" fill={fill} />}
      {option.shape === 'diamond' && <path d="M10 1 19 10 10 19 1 10Z" fill={fill} />}
    </svg>
  )
}

export function findOption(round: RoundSpec | undefined, id: string | null): GameOption | undefined {
  return id === null ? undefined : round?.options.find((o) => o.id === id)
}

/** An option shown compactly (in reveals and the prediction log). */
export function OptionChip({ roundId, optionId, large = false }: { roundId: string; optionId: string | null; large?: boolean }) {
  const option = findOption(getRound(roundId), optionId)
  if (!option) return <span className="text-muted">—</span>
  return (
    <span className={`inline-flex items-center gap-2 ${large ? 'font-display text-2xl font-semibold tracking-tight sm:text-3xl' : ''}`}>
      <Swatch option={option} size={large ? 22 : 14} />
      {option.label}
    </span>
  )
}
