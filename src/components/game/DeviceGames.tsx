/**
 * "Human vs Algorithm" totals across every game played in this browser.
 * Real games only — synthetic sample data is never mixed in here.
 */
import { Link } from 'react-router-dom'
import { KIND_NAMES, roundsInLevel } from '../../game/levels'
import { duel, score } from '../../game/stats'
import type { GameKind } from '../../game/types'
import { loadRuns } from '../../utils/storage'
import { SectionHeader } from '../Section'
import { AgentLabel } from './Agents'

const DUEL_LENGTH = roundsInLevel(4).length
const pct = (n: number | null) => (n === null ? '—' : `${Math.round(n * 100)}%`)

export default function DeviceGames() {
  const runs = loadRuns().filter((r) => r.completedAt)
  const all = runs.flatMap((r) => r.rounds)
  const s = score(all)
  const duels = runs.map((r) => duel(r.rounds, DUEL_LENGTH).outcome)
  const kinds: GameKind[] = ['direction', 'color', 'number', 'pattern', 'dilemma']

  return (
    <section className="container-page pb-16" aria-labelledby="games-title">
      <SectionHeader index="00 · Human vs Algorithm" title="Games on this device" id="games-title">
        Totals across every finished game in this browser. Real games only. There is no shared server, so this is not a global leaderboard.
      </SectionHeader>
      {runs.length === 0 ? (
        <div className="grid-bg border border-line px-6 py-12 text-center">
          <p className="text-ink-2">No finished games in this browser yet.</p>
          <Link to="/experiment" className="btn btn-primary mt-6">Play against the algorithm</Link>
        </div>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
          <dl className="grid grid-cols-2 gap-px self-start border border-line bg-line">
            <div className="bg-bg p-5">
              <dt className="eyebrow">Games</dt>
              <dd className="mt-3 font-display text-3xl font-semibold tabular">{runs.length}</dd>
            </div>
            <div className="bg-bg p-5">
              <dt><AgentLabel who="algorithm">Accuracy</AgentLabel></dt>
              <dd className="mt-3 font-display text-3xl font-semibold tabular text-signal">{pct(s.accuracy)}</dd>
              <dd className="mt-1 text-xs text-muted">{s.correct}/{s.scored} · random {pct(s.randomRate)}</dd>
            </div>
            <div className="bg-bg p-5">
              <dt><AgentLabel who="algorithm">Duels won</AgentLabel></dt>
              <dd className="mt-3 font-display text-3xl font-semibold tabular">{duels.filter((o) => o === 'algorithm').length}</dd>
            </div>
            <div className="bg-bg p-5">
              <dt><AgentLabel who="human">Duels won</AgentLabel></dt>
              <dd className="mt-3 font-display text-3xl font-semibold tabular">{duels.filter((o) => o === 'human').length}</dd>
              <dd className="mt-1 text-xs text-muted">{duels.filter((o) => o === 'draw').length} draws</dd>
            </div>
          </dl>
          <div>
            <p className="eyebrow mb-4">Accuracy by mini-game · │ = random guessing</p>
            {kinds.map((k) => {
              const ks = score(all.filter((r) => r.kind === k))
              if (ks.scored === 0) return null
              const acc = (ks.accuracy ?? 0) * 100
              const base = (ks.randomRate ?? 0) * 100
              return (
                <div key={k} className="mb-4">
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{KIND_NAMES[k]}</span>
                    <span className="font-mono text-xs tabular text-muted"><span className="text-ink">{ks.correct}/{ks.scored}</span> · random {Math.round(base)}%</span>
                  </div>
                  <div className="relative h-2.5 bg-line" role="img" aria-label={`${KIND_NAMES[k]}: ${Math.round(acc)}% predicted versus ${Math.round(base)}% random`}>
                    <div className="h-full rounded-r-[4px] bg-signal" style={{ width: `${acc}%` }} />
                    <div className="absolute -top-1 h-[18px] w-0.5 bg-ink" style={{ left: `calc(${base}% - 1px)` }} />
                  </div>
                </div>
              )
            })}
            <p className="mt-2 text-xs leading-relaxed text-muted">{runs.length < 10 ? 'Early results: too few games to draw general conclusions.' : ''}</p>
          </div>
        </div>
      )}
    </section>
  )
}
