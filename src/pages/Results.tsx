/**
 * RESULTS — the final report for the latest game.
 * Every number is recomputed here from the stored rounds; nothing is stored pre-scored.
 */
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AccuracyTrend from '../components/charts/AccuracyTrend'
import { AgentLabel, AlgorithmMark, HumanMark } from '../components/game/Agents'
import PredictionLog from '../components/game/PredictionLog'
import ResultCard from '../components/game/ResultCard'
import { SectionHeader } from '../components/Section'
import { EmptyState, Notice } from '../components/States'
import { trackRecords, verifyLock, weightFrom } from '../game/engine'
import { getExpert } from '../game/experts'
import { KIND_NAMES, LEVELS, roundsInLevel, TOTAL_ROUNDS } from '../game/levels'
import { mostCommonTendency, observations, strongestPattern } from '../game/report'
import { challengeLink, renderResultImage, shareText, summarize } from '../game/share'
import { duel, levelScore, runningAccuracy, score, verdict, type Score } from '../game/stats'
import type { GameKind, GameRun } from '../game/types'
import { deleteAllData, getLatestRun, loadRuns } from '../utils/storage'

const DUEL_LENGTH = roundsInLevel(4).length
const pct = (n: number | null) => (n === null ? '—' : `${Math.round(n * 100)}%`)

export default function Results() {
  const [run] = useState<GameRun | undefined>(getLatestRun)

  if (!run || run.rounds.every((r) => r.status === 'locked')) {
    return (
      <EmptyState code="No game yet" title="No results yet." actions={[{ to: '/experiment', label: 'Play against the algorithm', primary: true }, { to: '/explore', label: 'Explore the data' }]}>
        <p>Your report appears here after you play. It takes about four minutes and needs no sign-up.</p>
      </EmptyState>
    )
  }
  return <Report run={run} />
}

function Report({ run }: { run: GameRun }) {
  const navigate = useNavigate()
  const [status, setStatus] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const s = useMemo(() => score(run.rounds), [run])
  const v = verdict(s)
  const d = duel(run.rounds, DUEL_LENGTH)
  const tendency = mostCommonTendency(run.rounds)
  const strongest = strongestPattern(run.rounds)
  const notes = useMemo(() => observations(run.rounds), [run])
  const trend = runningAccuracy(run.rounds)
  const complete = !!run.completedAt
  const played = run.rounds.filter((r) => r.status !== 'locked')
  const locksOk = played.filter((r) => verifyLock(run.id, r)).length
  const summary = summarize(run)

  const records = trackRecords(run.rounds)
  const signals = Object.entries(records)
    .map(([id, r]) => ({ id, r, w: weightFrom(r) }))
    .sort((a, b) => b.w - a.w)
  const totalW = signals.reduce((a, b) => a + b.w, 0)

  const kinds = [...new Set(played.map((r) => r.kind))] as GameKind[]

  /* share actions */
  const copy = async (text: string, done: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setStatus(done)
    } catch {
      setStatus('Your browser blocked the clipboard. Select the text in the card and copy it manually.')
    }
  }
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'The Human Algorithm', text: shareText(run) })
        setStatus('Shared.')
      } catch {
        /* the person closed the share sheet */
      }
    } else {
      copy(shareText(run), 'Result copied — paste it anywhere.')
    }
  }
  const saveImage = async () => {
    const blob = await renderResultImage(run)
    if (!blob) return setStatus('Couldn’t create the image in this browser.')
    const file = new File([blob], 'human-algorithm-result.png', { type: 'image/png' })
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'The Human Algorithm' })
        return setStatus('Shared.')
      } catch {
        /* fall through to download */
      }
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'human-algorithm-result.png'
    a.click()
    URL.revokeObjectURL(url)
    setStatus('Image saved.')
  }

  const outcomeTitle =
    d.outcome === 'human' ? 'You beat the algorithm.' : d.outcome === 'algorithm' ? 'The algorithm wins.' : d.outcome === 'draw' ? 'Dead heat.' : 'Game in progress.'
  const outcomeColor = d.outcome === 'human' ? 'text-human' : d.outcome === 'algorithm' ? 'text-signal' : 'text-ink'

  const challenge = run.challenge
  const challengeResult = challenge && d.outcome !== 'incomplete'
    ? d.human > challenge.fooled ? 'win' : d.human < challenge.fooled ? 'lose' : 'tie'
    : null

  return (
    <div className="pb-8">
      {/* ───────────── Verdict ───────────── */}
      <section className="container-page pt-12 pb-12 md:pt-20">
        <p className="eyebrow mb-6 flex flex-wrap gap-x-4">
          <span>Run {run.id}</span>
          <span>{new Date(run.completedAt ?? run.startedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          <span>{played.length}/{TOTAL_ROUNDS} rounds</span>
        </p>
        {!complete && (
          <div className="mb-8 max-w-2xl">
            <Notice tone="warn">
              This game isn’t finished, so these results are partial. <Link to="/experiment" className="underline underline-offset-2">Continue playing</Link>.
            </Notice>
          </div>
        )}
        <h1 className={`display animate-pop text-[3rem] sm:text-7xl lg:text-8xl ${outcomeColor}`}>{outcomeTitle}</h1>

        {d.scored > 0 && (
          <div className="mt-10 grid max-w-3xl grid-cols-[1fr_auto_1fr] items-end gap-4 border-y border-line py-6">
            <div>
              <AgentLabel who="algorithm">Algorithm</AgentLabel>
              <p className="mt-2 font-display text-6xl font-semibold tabular tracking-tight text-signal sm:text-7xl">{d.algorithm}</p>
              <p className="mt-1 text-sm text-ink-2">predictions right in the duel</p>
            </div>
            <p className="pb-6 font-mono text-sm text-muted">vs</p>
            <div className="text-right">
              <AgentLabel who="human">You</AgentLabel>
              <p className="mt-2 font-display text-6xl font-semibold tabular tracking-tight text-human sm:text-7xl">{d.human}</p>
              <p className="mt-1 text-sm text-ink-2">times you broke its prediction</p>
            </div>
          </div>
        )}
        {d.timeouts > 0 && <p className="mt-3 font-mono text-xs text-muted">{d.timeouts} duel round(s) timed out and were not scored.</p>}

        {challenge && (
          <div className="mt-8 max-w-3xl border border-human/60 bg-human/[0.06] px-5 py-4">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-human">Friend challenge</p>
            <p className="mt-2 font-display text-xl tracking-tight sm:text-2xl">
              Your friend fooled it {challenge.fooled} of {challenge.duel} times. You fooled it {d.human} of {d.scored}.{' '}
              {challengeResult === 'win' && <span className="text-human">You win the challenge.</span>}
              {challengeResult === 'lose' && <span className="text-signal">Your friend wins this one.</span>}
              {challengeResult === 'tie' && <span>It’s a tie.</span>}
            </p>
            <p className="mt-1 text-xs text-muted">Your friend’s score came from their link and isn’t verified by this site.</p>
          </div>
        )}
      </section>

      {/* ───────────── Honest numbers ───────────── */}
      <section className="container-page" aria-labelledby="numbers-title">
        <h2 id="numbers-title" className="eyebrow mb-4">Your results · all rounds</h2>
        <dl className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          <Big label="Algorithm accuracy" value={pct(s.accuracy)} note={`${s.correct} of ${s.scored} predictions correct`} tone="algorithm" />
          <Big label="Random guessing" value={pct(s.randomRate)} note={`would expect ≈${s.randomExpected.toFixed(1)} of ${s.scored}`} />
          <Big
            label="Difference"
            value={s.accuracy !== null && s.randomRate !== null ? `${s.accuracy >= s.randomRate ? '+' : '−'}${Math.abs(Math.round((s.accuracy - s.randomRate) * 100))} pts` : '—'}
            note="percentage points, algorithm minus random"
          />
          <Big label="Chance it was luck" value={s.luckChance === null ? '—' : s.luckChance < 0.001 ? '<0.1%' : pct(s.luckChance)} note="that random guessing scores this high" />
        </dl>
        <div className={`mt-4 border-l-2 pl-4 ${v.kind === 'clearly-better' ? 'border-signal' : 'border-human'}`}>
          <p className="font-display text-xl tracking-tight">{v.headline}</p>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-ink-2">{v.detail}</p>
        </div>
        <p className="mt-4 max-w-3xl text-xs leading-relaxed text-muted">
          Why random isn’t a flat 50%: rounds have 2, 3, 4 or 10 options, so a random guesser is right 1/2, 1/3, 1/4 or 1/10 of the time
          depending on the round. The baseline adds those up over the rounds you actually played. Timed-out rounds count for neither side.
        </p>
      </section>

      {/* ───────────── Breakdown ───────────── */}
      <section className="container-page pt-20" aria-labelledby="breakdown-title">
        <SectionHeader index="01 · Round by round" title="How the duel unfolded" id="breakdown-title">
          The orange line is the algorithm’s running accuracy. The dashed line is what random guessing would expect over the same rounds.
        </SectionHeader>
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          <div className="border border-line p-3 sm:p-5">{trend.length > 0 ? <AccuracyTrend data={trend} /> : <p className="text-muted">No scored rounds.</p>}</div>
          <div className="space-y-6">
            <div>
              <p className="eyebrow mb-3">By level</p>
              {LEVELS.map((l) => <Meter key={l.level} label={`${l.level}. ${l.name}`} s={levelScore(run.rounds, l.level)} />)}
            </div>
            <div>
              <p className="eyebrow mb-3">By mini-game</p>
              {kinds.map((k) => <Meter key={k} label={KIND_NAMES[k]} s={score(run.rounds.filter((r) => r.kind === k))} />)}
            </div>
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.1em] text-muted">Bar = algorithm · │ = random guessing</p>
          </div>
        </div>
      </section>

      {/* ───────────── Human pattern ───────────── */}
      <section className="mt-24 border-y border-line bg-surface" aria-labelledby="pattern-title">
        <div className="container-page py-20">
          <SectionHeader index="02 · Your human pattern" title="What it found" id="pattern-title">
            Based only on your choices in this game. These describe what you did here — not who you are.
          </SectionHeader>
          <dl className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            <Big label="Predictability" value={pct(s.accuracy)} note="share of your moves it predicted" tone="algorithm" />
            <Big label="Most common tendency" value={tendency.label} note={tendency.detail} />
            <Big label="Strongest pattern" value={strongest?.name ?? 'None stood out'} note={strongest?.text ?? 'No signal predicted you consistently better than chance.'} />
            <Big label="Times you fooled it" value={String(s.fooled)} note={`of ${s.scored} scored rounds`} tone="human" />
          </dl>

          <h3 className="eyebrow mt-14 mb-4">What we noticed</h3>
          {notes.length === 0 ? (
            <p className="border border-dashed border-line p-6 text-ink-2">Not enough rounds yet to describe a pattern.</p>
          ) : (
            <ol className="grid gap-px border border-line bg-line md:grid-cols-2">
              {notes.map((n, i) => (
                <li key={n.id} className="animate-enter bg-bg p-6" style={{ animationDelay: `${i * 70}ms` }}>
                  <p className="eyebrow mb-3 flex justify-between"><span>{n.tag}</span><span>{String(i + 1).padStart(2, '0')}</span></p>
                  <p className="leading-relaxed">{n.text}</p>
                </li>
              ))}
            </ol>
          )}

          <h3 className="eyebrow mt-14 mb-4">Signals the algorithm used, by final trust</h3>
          <ul className="divide-y divide-line border-y border-line">
            {signals.map(({ id, r, w }) => (
              <li key={id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-3 sm:grid-cols-[14rem_1fr_auto]">
                <span className="font-display font-semibold tracking-tight">{getExpert(id)?.name ?? id}</span>
                <span className="order-3 col-span-2 text-sm text-ink-2 sm:order-none sm:col-span-1">{getExpert(id)?.description}</span>
                <span className="text-right font-mono text-xs tabular text-muted">
                  own pick right {r.hits}/{r.rounds} · trust <span className="text-ink">{Math.round((w / totalW) * 100)}%</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────────── Audit ───────────── */}
      <section className="container-page pt-20" aria-labelledby="log-title">
        <SectionHeader index="03 · The evidence" title="Every prediction, checked" id="log-title">
          Each prediction was locked with a SHA-256 code before you chose. Re-hashing the revealed predictions here:{' '}
          <span className={locksOk === played.length ? 'text-ink' : 'text-signal'}>
            {locksOk} of {played.length} locks verified {locksOk === played.length ? '✓' : '✕'}
          </span>
          .
        </SectionHeader>
        <PredictionLog rounds={run.rounds} runId={run.id} />
      </section>

      {/* ───────────── Share ───────────── */}
      <section className="container-page pt-24" aria-labelledby="share-title">
        <SectionHeader index="04 · Share" title="Think you’re unpredictable?" id="share-title">
          Send your score to a friend. Their link opens the game with your duel score as the target.
        </SectionHeader>
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,26rem)_1fr]">
          <ResultCard summary={summary} />
          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button type="button" className="btn btn-primary" onClick={() => copy(shareText(run), 'Result copied — paste it anywhere.')}>Copy result</button>
              <button type="button" className="btn btn-ghost" onClick={share}>Share</button>
              <button type="button" className="btn btn-ghost" onClick={saveImage}>Save image</button>
            </div>
            <div className="mt-8 border border-line p-5">
              <p className="eyebrow mb-2">Challenge a friend</p>
              <p className="text-sm leading-relaxed text-ink-2">Their game starts with your score on screen: you fooled it {d.human} of {d.scored} times in the duel.</p>
              <code className="mt-3 block overflow-x-auto bg-raised px-3 py-2 font-mono text-xs text-ink">{challengeLink(run)}</code>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button type="button" className="btn btn-primary" onClick={() => copy(challengeLink(run), 'Challenge link copied.')}>Copy challenge link</button>
                <button type="button" className="btn btn-ghost" onClick={() => navigate('/experiment')}>Play again</button>
              </div>
            </div>
            <p className="mt-4 min-h-5 font-mono text-xs text-human" role="status" aria-live="polite">{status}</p>
          </div>
        </div>
      </section>

      {/* ───────────── Local leaderboard ───────────── */}
      <LocalRuns currentId={run.id} />

      <section className="container-page pt-12">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted">
          <button type="button" className="hover:text-ink" onClick={() => copy(JSON.stringify(run, null, 2), 'Raw data copied as JSON.')}>Copy raw data (JSON)</button>
          {!confirmDelete ? (
            <button type="button" className="hover:text-ink" onClick={() => setConfirmDelete(true)}>Delete my data from this device</button>
          ) : (
            <span className="flex flex-wrap items-center gap-3 normal-case tracking-normal">
              <span className="text-ink">Delete every game stored in this browser? This can’t be undone.</span>
              <button type="button" className="btn btn-ghost !min-h-9" onClick={() => { deleteAllData(); navigate('/') }}>Delete</button>
              <button type="button" className="btn btn-ghost !min-h-9" onClick={() => setConfirmDelete(false)}>Cancel</button>
            </span>
          )}
        </div>
      </section>
    </div>
  )
}

function Big({ label, value, note, tone }: { label: string; value: string; note?: string; tone?: 'algorithm' | 'human' }) {
  return (
    <div className="flex flex-col bg-bg p-5 sm:p-6">
      <dt className="eyebrow">{label}</dt>
      <dd className={`mt-4 font-display text-3xl font-semibold tabular tracking-tight sm:text-4xl ${tone === 'algorithm' ? 'text-signal' : tone === 'human' ? 'text-human' : ''}`}>{value}</dd>
      {note && <dd className="mt-2 text-xs leading-relaxed text-muted">{note}</dd>}
    </div>
  )
}

/** Accuracy bar with a tick for the random baseline. */
function Meter({ label, s }: { label: string; s: Score }) {
  if (s.scored === 0) return null
  const acc = (s.accuracy ?? 0) * 100
  const base = (s.randomRate ?? 0) * 100
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between gap-3 text-sm">
        <span>{label}</span>
        <span className="font-mono text-xs tabular text-muted">
          <span className="text-ink">{s.correct}/{s.scored}</span> · random {Math.round(base)}%
        </span>
      </div>
      <div className="relative h-2.5 bg-line" role="img" aria-label={`${label}: ${Math.round(acc)}% correct versus ${Math.round(base)}% random`}>
        <div className="h-full rounded-r-[4px] bg-signal transition-[width] duration-700" style={{ width: `${acc}%` }} />
        <div className="absolute -top-1 h-[18px] w-0.5 bg-ink" style={{ left: `calc(${base}% - 1px)` }} />
      </div>
    </div>
  )
}

/** "Leaderboard" for this device only — no server, so no global ranking. */
function LocalRuns({ currentId }: { currentId: string }) {
  const runs = loadRuns()
    .filter((r) => r.completedAt)
    .map((r) => ({ run: r, s: score(r.rounds), d: duel(r.rounds, DUEL_LENGTH) }))
    .sort((a, b) => b.d.human - a.d.human || (a.s.accuracy ?? 1) - (b.s.accuracy ?? 1))
  if (runs.length < 2) return null
  return (
    <section className="container-page pt-20" aria-labelledby="local-title">
      <SectionHeader index="05 · On this device" title="Your games, ranked" id="local-title">
        Ranked by how often you fooled it in the duel. Stored only in this browser — there is no online leaderboard.
      </SectionHeader>
      <div className="overflow-x-auto border border-line">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-line">
              {['#', 'Date', 'Duel', 'Algorithm accuracy', ''].map((h) => <th key={h} scope="col" className="eyebrow px-3 py-3 font-normal">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {runs.map(({ run, s, d }, i) => (
              <tr key={run.id} className={`border-b border-line last:border-0 ${run.id === currentId ? 'bg-surface' : ''}`}>
                <td className="px-3 py-2.5 font-mono text-xs text-muted">{i + 1}</td>
                <td className="px-3 py-2.5">{new Date(run.startedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</td>
                <td className="px-3 py-2.5 font-mono text-xs">
                  <span className="text-signal"><AlgorithmMark className="mr-1 inline h-3 w-3" />{d.algorithm}</span> – <span className="text-human">{d.human}<HumanMark className="ml-1 inline h-3 w-3" /></span>
                </td>
                <td className="px-3 py-2.5 font-mono text-xs tabular">{pct(s.accuracy)}</td>
                <td className="px-3 py-2.5 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-muted">{run.id === currentId ? 'this game' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
