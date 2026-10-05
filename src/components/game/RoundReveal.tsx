/**
 * After the choice: what the algorithm predicted, what you chose, who won the
 * round, why it predicted that, what it learned, and proof the prediction was
 * locked before you chose.
 */
import { useEffect, useMemo, useRef } from 'react'
import { learningFrom, shortCode, verifyLock, commitmentText } from '../../game/engine'
import { getRound, KIND_NAMES } from '../../game/levels'
import type { RoundRecord, RoundSpec } from '../../game/types'
import { AgentLabel, OptionChip, findOption } from './Agents'

interface Props {
  round: RoundSpec
  record: RoundRecord
  /** All rounds so far, including this one. */
  rounds: RoundRecord[]
  runId: string
  nextLabel: string
  /** Duel rounds: skip the learning breakdown to keep the pace up. */
  compact?: boolean
  onNext: () => void
}

export default function RoundReveal({ round, record, rounds, runId, nextLabel, compact = false, onNext }: Props) {
  const nextRef = useRef<HTMLButtonElement>(null)
  useEffect(() => nextRef.current?.focus({ preventScroll: true }), [])

  const verified = useMemo(() => verifyLock(runId, record), [runId, record])
  const learning = useMemo(() => learningFrom(record, rounds), [record, rounds])
  const p = record.prediction
  const predictedLabel = findOption(round, p.optionId)?.label ?? p.optionId

  const outcome = record.status === 'timeout' ? 'timeout' : record.correct ? 'algorithm' : 'human'

  return (
    <section className="animate-fade" aria-labelledby="verdict">
      {/* Verdict */}
      <div className={`border px-5 py-6 sm:px-8 sm:py-8 ${outcome === 'algorithm' ? 'border-signal/70 bg-signal/[0.06]' : outcome === 'human' ? 'border-human/70 bg-human/[0.06]' : 'border-line-strong bg-surface'}`}>
        <h2 id="verdict" className={`display flex items-center gap-4 text-5xl animate-pop sm:text-7xl ${outcome === 'algorithm' ? 'text-signal' : outcome === 'human' ? 'text-human animate-shake' : 'text-ink'}`}>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center border-2 border-current text-3xl sm:h-16 sm:w-16 sm:text-4xl" aria-hidden="true">
            {outcome === 'algorithm' ? '✓' : outcome === 'human' ? '✕' : '…'}
          </span>
          {outcome === 'algorithm' ? 'I got you.' : outcome === 'human' ? 'You fooled me.' : 'Time’s up.'}
        </h2>
        <p className="mt-3 text-ink-2">
          {outcome === 'algorithm' && 'The algorithm predicted your choice before you made it.'}
          {outcome === 'human' && 'Your choice was different from the locked prediction. Point to you.'}
          {outcome === 'timeout' && 'No choice was recorded, so this round doesn’t count for either side.'}
        </p>

        <div className="mt-6 grid gap-px border border-line bg-line sm:grid-cols-2">
          <div className="bg-bg p-4 sm:p-5">
            <AgentLabel who="algorithm">Predicted</AgentLabel>
            <p className="mt-3"><OptionChip roundId={round.id} optionId={p.optionId} large /></p>
            <p className="mt-2 font-mono text-xs text-muted">{Math.round(p.confidence * 100)}% confident · random {Math.round(100 / round.options.length)}%</p>
          </div>
          <div className="bg-bg p-4 sm:p-5">
            <AgentLabel who="human">You chose</AgentLabel>
            <p className="mt-3">{record.choice ? <OptionChip roundId={round.id} optionId={record.choice} large /> : <span className="font-display text-2xl text-muted">No answer</span>}</p>
            {record.responseMs !== undefined && record.choice && <p className="mt-2 font-mono text-xs text-muted">in {(record.responseMs / 1000).toFixed(1)}s</p>}
          </div>
        </div>
      </div>

      {/* Why */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <p className="eyebrow mb-3 !text-signal">Why I predicted {predictedLabel}</p>
          <p className="leading-relaxed text-ink">{p.reason}</p>
          {round.explanation && <p className="mt-3 text-sm leading-relaxed text-ink-2">{round.explanation}</p>}
        </div>

        {/* What it learned */}
        {!compact && learning.length > 0 && (
          <div>
            <p className="eyebrow mb-3">What I learned</p>
            <ul className="space-y-2">
              {learning.map((l) => {
                const delta = l.trustAfter - l.trustBefore
                return (
                  <li key={l.expertId} className="flex items-center justify-between gap-3 border-b border-line pb-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className={`font-mono text-xs ${l.hit ? 'text-signal' : 'text-muted'}`} aria-hidden="true">{l.pick ? (l.hit ? '✓' : '✕') : '–'}</span>
                      <span className="truncate">{l.name}</span>
                      <span className="sr-only">{l.pick ? (l.hit ? 'was right' : 'was wrong') : 'had no preference'}</span>
                    </span>
                    <span className="shrink-0 font-mono text-xs tabular text-muted">
                      trust {Math.round(l.trustBefore * 100)}% → <span className="text-ink">{Math.round(l.trustAfter * 100)}%</span>{' '}
                      <span className={delta > 0.005 ? 'text-signal' : delta < -0.005 ? 'text-human' : ''}>{delta > 0.005 ? '▲' : delta < -0.005 ? '▼' : '·'}</span>
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Proof */}
      <details className="mt-6 border border-line px-4 py-3 text-sm">
        <summary className="cursor-pointer list-none font-mono text-xs uppercase tracking-[0.12em] text-ink-2">
          <span className={verified ? 'text-ink' : 'text-signal'}>{verified ? '✓ Lock verified' : '✕ Lock mismatch'}</span>
          <span className="text-muted"> · code {shortCode(p.commitment)} was shown before you chose · how to check ▾</span>
        </summary>
        <div className="mt-3 space-y-2 text-ink-2">
          <p>
            Before you chose, the page showed the first 12 characters of a SHA-256 fingerprint. Now that the prediction and its secret are revealed,
            hashing this exact text must reproduce that fingerprint:
          </p>
          <code className="block overflow-x-auto bg-raised px-3 py-2 font-mono text-xs text-ink">{commitmentText(runId, record.roundId, p.optionId, p.salt)}</code>
          <p className="font-mono text-xs break-all text-muted">SHA-256 = {p.commitment}</p>
          <p className="text-xs text-muted">Paste the text into any SHA-256 tool to check it independently. Changing the prediction by even one letter changes the code completely.</p>
        </div>
      </details>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-muted">
          {KIND_NAMES[round.kind]} · {getRound(record.roundId)?.options.length} options
        </p>
        <button ref={nextRef} type="button" onClick={onNext} className="btn btn-primary w-full sm:w-auto">
          {nextLabel} <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  )
}
