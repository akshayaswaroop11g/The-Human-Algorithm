/**
 * The algorithm's side of the screen, before the player chooses.
 *
 *   thinking → a short "analyzing" beat (purely visual — the prediction already exists)
 *   locked   → "PREDICTION LOCKED" + confidence + the lock code (SHA-256 fingerprint)
 *
 * In 'sealed' mode the predicted option is NOT shown until after the choice.
 */
import { getExpert } from '../../game/experts'
import { shortCode } from '../../game/engine'
import { PREDICTION_VISIBILITY } from '../../game/levels'
import type { LockedPrediction, RoundSpec } from '../../game/types'
import { AgentLabel, OptionChip } from './Agents'

function LockIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
      <rect x="4" y="9" width="12" height="9" fill="var(--color-signal)" />
      <path d="M6.5 9V6.5a3.5 3.5 0 0 1 7 0V9" fill="none" stroke="var(--color-signal)" strokeWidth="1.8" />
    </svg>
  )
}

export default function PredictionPanel({
  round,
  prediction,
  thinking,
  movesSeen,
}: {
  round: RoundSpec
  prediction: LockedPrediction
  thinking: boolean
  movesSeen: number
}) {
  const signals = prediction.votes.map((v) => getExpert(v.expertId)?.name ?? v.expertId)

  return (
    <section
      className={`relative overflow-hidden border bg-surface px-5 py-5 sm:px-6 ${thinking ? 'border-line-strong' : 'border-signal/70 animate-lock'}`}
      aria-live="polite"
      aria-label="The algorithm's prediction"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AgentLabel who="algorithm">Algorithm · My prediction</AgentLabel>
        {!thinking && (
          <span className="inline-flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-signal">
            <LockIcon /> Locked
          </span>
        )}
      </div>

      {thinking ? (
        <div className="mt-4">
          <p className="font-display text-xl tracking-tight text-ink-2 sm:text-2xl">
            {movesSeen === 0 ? 'Reading the room…' : `Analyzing your ${movesSeen} previous ${movesSeen === 1 ? 'move' : 'moves'}…`}
          </p>
          <div className="relative mt-4 h-px w-full overflow-hidden bg-line" aria-hidden="true">
            <span className="absolute inset-y-0 left-0 w-1/3 animate-scan bg-signal" />
          </div>
          <p className="mt-3 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-muted">
            Consulting: {signals.join(' · ') || 'opening guess'}
          </p>
        </div>
      ) : (
        <div className="mt-4 animate-fade">
          {PREDICTION_VISIBILITY === 'open' ? (
            <p className="font-display text-2xl tracking-tight sm:text-3xl">
              I think you’ll choose <OptionChip roundId={round.id} optionId={prediction.optionId} large />
            </p>
          ) : (
            <p className="font-display text-2xl tracking-tight sm:text-3xl">
              My prediction is in. <span className="text-ink-2">It stays sealed until you choose.</span>
            </p>
          )}
          <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <p className="mb-2 flex justify-between font-mono text-[0.68rem] uppercase tracking-[0.12em] text-muted">
                <span>Confidence</span>
                <span className="tabular text-ink">{Math.round(prediction.confidence * 100)}%</span>
              </p>
              <div className="h-1.5 w-full bg-line" aria-hidden="true">
                <div className="h-full bg-signal transition-[width] duration-700" style={{ width: `${Math.round(prediction.confidence * 100)}%` }} />
              </div>
              <p className="mt-2 font-mono text-[0.66rem] text-muted">Random guessing: {Math.round(100 / round.options.length)}%</p>
            </div>
            <div className="sm:text-right">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-muted">Lock code</p>
              <p className="mt-1 font-mono text-base tracking-wider text-ink" title="SHA-256 fingerprint of the prediction. Checked after you choose.">
                {shortCode(prediction.commitment)}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
