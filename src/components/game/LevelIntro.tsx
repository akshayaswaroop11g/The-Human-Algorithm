/**
 * The title card before each level. Level 4 gets the "I've learned your patterns" treatment,
 * listing the signals the algorithm currently trusts most — computed, not invented.
 */
import { useEffect, useRef } from 'react'
import { trackRecords, weightFrom } from '../../game/engine'
import { getExpert } from '../../game/experts'
import { levelInfo, roundsInLevel } from '../../game/levels'
import { score } from '../../game/stats'
import type { Level, RoundRecord } from '../../game/types'
import { AgentLabel, AlgorithmMark, HumanMark } from './Agents'

export default function LevelIntro({ level, rounds, onStart }: { level: Level; rounds: RoundRecord[]; onStart: () => void }) {
  const info = levelInfo(level)
  const count = roundsInLevel(level).length
  const buttonRef = useRef<HTMLButtonElement>(null)
  useEffect(() => buttonRef.current?.focus({ preventScroll: true }), [])

  const s = score(rounds)
  const records = trackRecords(rounds)
  const trusted = Object.entries(records)
    .filter(([id, r]) => id !== 'opening' && r.rounds >= 2)
    .map(([id, r]) => ({ id, r, w: weightFrom(r) }))
    .sort((a, b) => b.w - a.w)
    .slice(0, 3)

  const duel = level === 4

  return (
    <section className="animate-reveal py-4" aria-labelledby="level-title">
      <p className="eyebrow mb-6 flex items-center gap-3">
        <span className={`inline-flex h-7 min-w-7 items-center justify-center border px-2 font-mono text-xs ${duel ? 'border-signal text-signal' : 'border-line-strong text-ink'}`}>{level}/4</span>
        Level {level} · {count} rounds
      </p>
      <h1 id="level-title" className={`display text-5xl sm:text-7xl ${duel ? 'text-signal' : ''}`}>
        {duel ? (
          <>
            I’ve learned
            <br />
            your patterns.
          </>
        ) : (
          info.name
        )}
      </h1>
      <p className="mt-5 font-display text-2xl tracking-tight text-ink sm:text-3xl">{duel ? 'Now try to beat me.' : info.tagline}</p>
      <p className="mt-6 max-w-xl leading-relaxed text-ink-2">{info.description}</p>

      {duel && (
        <div className="mt-10 grid gap-px border border-line bg-line sm:grid-cols-2">
          <div className="bg-bg p-5">
            <AgentLabel who="algorithm">So far</AgentLabel>
            <p className="mt-3 font-display text-3xl font-semibold tabular tracking-tight">
              {s.correct}/{s.scored} <span className="text-lg text-muted">predicted</span>
            </p>
            <p className="mt-1 font-mono text-xs text-muted">random guessing would expect ≈{s.randomExpected.toFixed(1)}</p>
          </div>
          <div className="bg-bg p-5">
            <p className="eyebrow mb-3">Signals I trust most right now</p>
            {trusted.length === 0 ? (
              <p className="text-sm text-ink-2">None stands out yet.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {trusted.map((t) => (
                  <li key={t.id} className="flex justify-between gap-3">
                    <span>{getExpert(t.id)?.name}</span>
                    <span className="font-mono text-xs tabular text-muted">right {t.r.hits}/{t.r.rounds}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {duel && (
        <div className="mt-8 flex items-center gap-4 font-display text-2xl font-semibold tracking-tight sm:text-3xl" aria-hidden="true">
          <AlgorithmMark className="h-9 w-9" />
          <span className="text-signal">Algorithm</span>
          <span className="font-mono text-sm text-muted">vs</span>
          <span className="text-human">You</span>
          <HumanMark className="h-9 w-9" />
        </div>
      )}

      <button ref={buttonRef} type="button" onClick={onStart} className="btn btn-primary mt-10 w-full sm:w-auto">
        {duel ? 'Start the duel' : `Start level ${level}`} <span aria-hidden="true">→</span>
      </button>
    </section>
  )
}
