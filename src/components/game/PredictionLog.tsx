/**
 * Every round, in order: what the algorithm predicted, what you chose, and the result.
 * Each row also shows the lock code and whether it verifies — so the score can be audited.
 */
import { shortCode, verifyLock } from '../../game/engine'
import { KIND_NAMES } from '../../game/levels'
import type { RoundRecord } from '../../game/types'
import { OptionChip } from './Agents'

export default function PredictionLog({ rounds, runId, showLocks = true }: { rounds: RoundRecord[]; runId: string; showLocks?: boolean }) {
  const done = rounds.filter((r) => r.status !== 'locked')
  if (done.length === 0) return <p className="border border-dashed border-line p-4 text-sm text-muted">No rounds played yet.</p>

  return (
    <div className="overflow-x-auto border border-line">
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">Prediction log</caption>
        <thead>
          <tr className="border-b border-line">
            {['Round', 'Game', 'Algorithm predicted', 'You chose', 'Result', ...(showLocks ? ['Lock code'] : [])].map((h) => (
              <th key={h} scope="col" className="eyebrow px-3 py-3 font-normal">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {done.map((r, i) => (
            <tr key={r.roundId} className="border-b border-line last:border-0">
              <td className="px-3 py-2.5 font-mono text-xs text-muted">
                {String(i + 1).padStart(2, '0')} <span className="text-line-strong">·</span> L{r.level}
              </td>
              <td className="px-3 py-2.5 text-ink-2">{KIND_NAMES[r.kind]}</td>
              <td className="px-3 py-2.5">
                <OptionChip roundId={r.roundId} optionId={r.prediction.optionId} />
                <span className="ml-2 font-mono text-[0.68rem] text-muted">{Math.round(r.prediction.confidence * 100)}%</span>
              </td>
              <td className="px-3 py-2.5">{r.choice ? <OptionChip roundId={r.roundId} optionId={r.choice} /> : <span className="text-muted">timed out</span>}</td>
              <td className="px-3 py-2.5 font-mono text-xs uppercase tracking-[0.08em]">
                {r.status === 'timeout' ? (
                  <span className="text-muted">— not scored</span>
                ) : r.correct ? (
                  <span className="text-signal">✓ Predicted</span>
                ) : (
                  <span className="text-human">✕ Fooled it</span>
                )}
              </td>
              {showLocks && (
                <td className="px-3 py-2.5 font-mono text-xs text-muted">
                  {shortCode(r.prediction.commitment)} {verifyLock(runId, r) ? <span className="text-ink">✓</span> : <span className="text-signal">✕</span>}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
