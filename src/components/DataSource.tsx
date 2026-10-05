/**
 * Switch between REAL data (sessions stored on this device) and the
 * clearly-labelled SYNTHETIC sample. The two are never mixed.
 */
import { useMemo, useState } from 'react'
import { getSampleSessions, SAMPLE_SIZE } from '../data/sampleData'
import { aggregateSessions, EARLY_RESULTS_THRESHOLD } from '../logic/aggregate'
import { getRound } from '../game/levels'
import type { GameRun } from '../game/types'
import type { ResponseRecord, Session } from '../types'
import { getScenario } from '../data/scenarios'
import { loadRuns, loadSessions } from '../utils/storage'

/** Dilemma rounds from games use the original scenarios, so they count toward the scenario splits too. */
function runToSession(run: GameRun): Session {
  const responses = run.rounds.flatMap((r): ResponseRecord[] => {
    const scenario = getScenario(getRound(r.roundId)?.scenarioId ?? '')
    if (r.kind !== 'dilemma' || r.status !== 'answered' || !scenario || (r.choice !== 'A' && r.choice !== 'B')) return []
    return [{
      sessionId: run.id,
      scenarioId: scenario.id,
      category: scenario.category,
      selectedOption: r.choice,
      responseTimeMs: r.responseMs ?? 0,
      timestamp: r.chosenAt ?? run.startedAt,
      signals: scenario.options.find((o) => o.id === r.choice)!.effects,
    }]
  })
  return { id: run.id, startedAt: run.startedAt, completedAt: run.completedAt, responses, predictions: [] }
}

export type DataSourceKind = 'device' | 'sample'

export function useAggregate() {
  const [source, setSource] = useState<DataSourceKind>('device')
  const deviceSessions = useMemo(() => [...loadSessions().filter((s) => !s.synthetic), ...loadRuns().map(runToSession)], [])
  const sessions = source === 'device' ? deviceSessions : getSampleSessions()
  const aggregate = useMemo(() => aggregateSessions(sessions), [sessions])
  return { source, setSource, aggregate }
}

export function DataSourceToggle({ source, onChange }: { source: DataSourceKind; onChange: (s: DataSourceKind) => void }) {
  const options: { value: DataSourceKind; label: string }[] = [
    { value: 'device', label: 'Real responses' },
    { value: 'sample', label: 'Sample data' },
  ]
  return (
    <div className="inline-flex border border-line-strong" role="radiogroup" aria-label="Data source">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={source === o.value}
          onClick={() => onChange(o.value)}
          className={`min-h-11 px-4 font-mono text-[0.7rem] uppercase tracking-[0.14em] transition-colors ${
            source === o.value ? 'bg-ink text-bg' : 'text-ink-2 hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** The label that tells people exactly what they are looking at. */
export function DataSourceBadge({ source, participants }: { source: DataSourceKind; participants: number }) {
  if (source === 'sample') {
    return (
      <div className="border border-signal/60 px-4 py-3" role="note">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-signal">Sample data — synthetic, not real participants</p>
        <p className="mt-1 text-sm leading-relaxed text-ink-2">
          {SAMPLE_SIZE} simulated participants generated from the scoring model with random preferences. Useful for seeing how the charts behave.
          It says nothing about how real people choose.
        </p>
      </div>
    )
  }
  return (
    <div className="border border-line px-4 py-3" role="note">
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-ink">
        {participants < EARLY_RESULTS_THRESHOLD ? 'Early results' : 'Real responses'} · {participants} {participants === 1 ? 'session' : 'sessions'}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-ink-2">
        Real, anonymous sessions stored in this browser. This version has no shared server, so only sessions run on this device appear here.
        Sample sizes this small cannot support general conclusions.
      </p>
    </div>
  )
}
