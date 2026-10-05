/**
 * Top of the game screen: which level you're on, which round, and the live score.
 * The score is computed from the stored rounds every render — nothing is cached or adjusted.
 */
import { LEVELS, ROUNDS, TOTAL_ROUNDS } from '../../game/levels'
import { duel, score } from '../../game/stats'
import type { Level, RoundRecord } from '../../game/types'
import { AgentLabel } from './Agents'

export function LevelTrack({ level, roundIndex }: { level: Level; roundIndex: number }) {
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <p className="eyebrow">
          <span className="text-ink">Level {level}</span> · {LEVELS[level - 1].name}
        </p>
        <p className="shrink-0 whitespace-nowrap font-mono text-sm tabular text-ink" aria-label={`Round ${roundIndex + 1} of ${TOTAL_ROUNDS}`}>
          Round {String(roundIndex + 1).padStart(2, '0')}
          <span className="text-muted"> / {TOTAL_ROUNDS}</span>
        </p>
      </div>
      <ol className="grid grid-cols-4 gap-1.5" aria-label="Levels">
        {LEVELS.map((l) => {
          const rounds = ROUNDS.filter((r) => r.level === l.level)
          const first = ROUNDS.indexOf(rounds[0])
          const done = Math.min(Math.max(roundIndex - first, 0), rounds.length)
          const state = l.level < level ? 'done' : l.level === level ? 'current' : 'next'
          return (
            <li key={l.level} aria-current={state === 'current' ? 'step' : undefined}>
              <div className="flex h-1 gap-[2px]">
                {rounds.map((r, i) => (
                  <span
                    key={r.id}
                    className={`flex-1 transition-colors duration-500 ${
                      state === 'done' || i < done ? (l.level === 4 ? 'bg-signal' : 'bg-ink') : i === done && state === 'current' ? 'bg-ink-2 animate-pulse' : 'bg-line'
                    }`}
                  />
                ))}
              </div>
              <p className={`mt-2 hidden font-mono text-[0.62rem] uppercase tracking-[0.12em] sm:block ${state === 'current' ? 'text-ink' : 'text-muted'}`}>
                {l.level}. {l.name}
              </p>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/** Live scoreboard. Level 4 switches to a head-to-head duel score. */
export function Scoreboard({ rounds, level, duelLength }: { rounds: RoundRecord[]; level: Level; duelLength: number }) {
  const s = score(rounds)
  if (level === 4) {
    const d = duel(rounds, duelLength)
    const played = rounds.filter((r) => r.level === 4 && r.status !== 'locked').length
    return (
      <div className="grid grid-cols-[1fr_auto_1fr] items-center border border-line bg-surface px-4 py-3 sm:px-6" aria-live="polite">
        <div>
          <AgentLabel who="algorithm" compact />
          <p className="mt-1 font-display text-4xl font-semibold tabular tracking-tight text-signal sm:text-5xl">{d.algorithm}</p>
        </div>
        <p className="px-3 text-center font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted">
          Duel
          <br />
          <span className="text-ink tabular">{played}/{duelLength}</span>
        </p>
        <div className="text-right">
          <AgentLabel who="human" compact />
          <p className="mt-1 font-display text-4xl font-semibold tabular tracking-tight text-human sm:text-5xl">{d.human}</p>
        </div>
      </div>
    )
  }
  return (
    <dl className="grid grid-cols-3 border border-line bg-surface" aria-live="polite">
      <div className="px-3 py-3 sm:px-5">
        <dt><AgentLabel who="algorithm" compact>Correct</AgentLabel></dt>
        <dd className="mt-1 font-display text-2xl font-semibold tabular tracking-tight sm:text-3xl">
          {s.correct}
          <span className="text-base text-muted"> / {s.scored}</span>
        </dd>
      </div>
      <div className="border-l border-line px-3 py-3 sm:px-5">
        <dt><AgentLabel who="human" compact>Fooled it</AgentLabel></dt>
        <dd className="mt-1 font-display text-2xl font-semibold tabular tracking-tight sm:text-3xl">{s.fooled}</dd>
      </div>
      <div className="border-l border-line px-3 py-3 sm:px-5">
        <dt className="whitespace-nowrap font-mono text-[0.62rem] uppercase tracking-[0.08em] text-muted sm:text-[0.72rem] sm:tracking-[0.16em]">Random</dt>
        <dd className="mt-1 font-display text-2xl font-semibold tabular tracking-tight text-ink-2 sm:text-3xl">
          ≈{s.randomExpected.toFixed(1)}
        </dd>
      </div>
    </dl>
  )
}
