/**
 * The social-media-friendly result card (also drawn as an image by share.ts).
 */
import type { ShareSummary } from '../../game/share'
import { AlgorithmMark, HumanMark } from './Agents'

export default function ResultCard({ summary: s }: { summary: ShareSummary }) {
  const headline =
    s.outcome === 'human' ? 'I beat the algorithm.' : s.outcome === 'algorithm' ? 'The algorithm beat me.' : s.outcome === 'draw' ? 'Dead heat.' : 'Human vs Algorithm.'
  return (
    <figure className="grid-bg relative aspect-[4/5] w-full max-w-full overflow-hidden border border-line-strong bg-bg p-7 sm:p-8" aria-label="Shareable result card">
      <div className="flex h-full flex-col">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">The Human Algorithm</p>
        <span className="mt-3 block h-0.5 w-10 bg-signal" aria-hidden="true" />
        <p className={`display mt-6 text-4xl sm:text-[2.6rem] ${s.outcome === 'human' ? 'text-human' : s.outcome === 'algorithm' ? 'text-signal' : ''}`}>{headline}</p>

        <dl className="mt-auto space-y-5">
          <div>
            <dt className="flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted"><AlgorithmMark className="h-3.5 w-3.5" /> Algorithm accuracy</dt>
            <dd className="font-display text-3xl font-semibold tabular tracking-tight text-signal">{s.accuracy}% <span className="text-lg text-muted">· {s.correct}/{s.scored}</span></dd>
          </div>
          <div>
            <dt className="flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted"><HumanMark className="h-3.5 w-3.5" /> I fooled it in the duel</dt>
            <dd className="font-display text-3xl font-semibold tabular tracking-tight text-human">{s.duelHuman} / {s.duelAlgorithm + s.duelHuman}</dd>
          </div>
          <div>
            <dt className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted">My strongest tendency</dt>
            <dd className="font-display text-2xl font-semibold tracking-tight">{s.tendency}</dd>
          </div>
        </dl>
        <p className="mt-6 border-t border-line pt-4 font-display text-xl tracking-tight">Can you beat it?</p>
      </div>
    </figure>
  )
}
