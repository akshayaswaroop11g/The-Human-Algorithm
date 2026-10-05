import { useState } from 'react'
import type { Scenario } from '../../types'

/**
 * One scenario's result: a single bar split into option A and option B.
 * Percentages and option names are always written out, so nothing depends on color alone.
 */
export default function SplitBar({
  scenario,
  shareA,
  n,
  yourChoice,
  number,
}: {
  scenario: Scenario
  shareA: number | null
  n: number
  yourChoice?: 'A' | 'B'
  number: number
}) {
  const [hover, setHover] = useState<'A' | 'B' | null>(null)
  const [a, b] = scenario.options
  const pctA = shareA === null ? null : Math.round(shareA * 100)
  const pctB = pctA === null ? null : 100 - pctA

  return (
    <div className="py-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="font-display text-lg font-semibold tracking-tight">
          <span className="mr-3 font-mono text-xs font-normal text-muted">#{String(number).padStart(2, '0')}</span>
          {a.label} <span className="font-normal text-muted">vs</span> {b.label}
        </p>
        <p className="eyebrow">{scenario.category} · n={n}</p>
      </div>

      {pctA === null || pctB === null ? (
        <p className="border border-dashed border-line px-4 py-3 text-sm text-muted">No responses yet.</p>
      ) : (
        <>
          <div className="mb-2 flex justify-between gap-4 text-sm">
            <span className={hover === 'B' ? 'opacity-50' : ''}>
              <span className="font-display text-2xl font-semibold tabular tracking-tight">{pctA}%</span>
              <span className="ml-2 text-ink-2">{a.label}</span>
              {yourChoice === 'A' && <span className="ml-2 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-signal">◆ You</span>}
            </span>
            <span className={`text-right ${hover === 'A' ? 'opacity-50' : ''}`}>
              {yourChoice === 'B' && <span className="mr-2 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-signal">You ◆</span>}
              <span className="mr-2 text-ink-2">{b.label}</span>
              <span className="font-display text-2xl font-semibold tabular tracking-tight">{pctB}%</span>
            </span>
          </div>
          <div className="flex h-3 gap-[2px]" role="img" aria-label={`${pctA}% chose ${a.label}, ${pctB}% chose ${b.label}, out of ${n} responses.`}>
            {pctA > 0 && (
              <div
                className="h-full rounded-l-[4px] bg-opt-a transition-[width,opacity] duration-700"
                style={{ width: `${pctA}%`, opacity: hover === 'B' ? 0.4 : 1 }}
                onMouseEnter={() => setHover('A')}
                onMouseLeave={() => setHover(null)}
                title={`${a.label}: ${pctA}%`}
              />
            )}
            {pctB > 0 && (
              <div
                className="h-full rounded-r-[4px] bg-opt-b transition-[width,opacity] duration-700"
                style={{ width: `${pctB}%`, opacity: hover === 'A' ? 0.4 : 1 }}
                onMouseEnter={() => setHover('B')}
                onMouseLeave={() => setHover(null)}
                title={`${b.label}: ${pctB}%`}
              />
            )}
          </div>
          <p className="mt-2 font-mono text-[0.66rem] uppercase tracking-[0.1em] text-muted">Trade-off · {scenario.tradeoff}</p>
        </>
      )}
    </div>
  )
}
