/**
 * HUMAN vs ALGORITHM — the game.
 *
 * Stages:
 *   start        → title screen (or "continue" for a run in progress)
 *   level-intro  → title card before each level
 *   thinking     → the prediction ALREADY exists and is saved; a short visual beat
 *   choosing     → prediction locked + lock code visible; the player can now choose
 *   reveal       → result, reasoning, learning, proof
 *   finishing    → short pause, then /results
 *
 * The order of operations in enterRound() and choose() is the experiment's
 * credibility: the prediction is made from earlier rounds and saved BEFORE the
 * options are enabled, and a locked round can be answered only once.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AgentLabel, AlgorithmMark, HumanMark } from '../components/game/Agents'
import ChoiceBoard from '../components/game/ChoiceBoard'
import Countdown from '../components/game/Countdown'
import { LevelTrack, Scoreboard } from '../components/game/GameHud'
import LevelIntro from '../components/game/LevelIntro'
import PredictionLog from '../components/game/PredictionLog'
import PredictionPanel from '../components/game/PredictionPanel'
import RoundReveal from '../components/game/RoundReveal'
import { Notice } from '../components/States'
import { displayOrderFor, makePrediction, scoreRound } from '../game/engine'
import { LEVELS, ROUNDS, roundsInLevel, TOTAL_ROUNDS } from '../game/levels'
import { parseChallenge } from '../game/share'
import type { GameRun, RoundRecord } from '../game/types'
import { createRun, getCurrentRun, saveRun, setCurrentRunId, storageAvailable } from '../utils/storage'

type Stage = 'start' | 'level-intro' | 'thinking' | 'choosing' | 'reveal' | 'finishing'

const DUEL_LENGTH = roundsInLevel(4).length

/** Index of the next round to play = rounds that are finished (answered or timed out). */
const nextIndex = (run: GameRun | null) => (run ? run.rounds.filter((r) => r.status !== 'locked').length : 0)

export default function Experiment() {
  const navigate = useNavigate()
  const location = useLocation()
  const challenge = useMemo(() => parseChallenge(location.search), [location.search])

  const [run, setRun] = useState<GameRun | null>(() => {
    const current = getCurrentRun()
    return current && !current.completedAt ? current : null
  })
  const [stage, setStage] = useState<Stage>('start')
  const [index, setIndex] = useState(() => nextIndex(run))
  const [canStore] = useState(storageAvailable)
  const shownAt = useRef(0)
  const busy = useRef(false)

  const round = ROUNDS[index]
  const record = run?.rounds.find((r) => r.roundId === round?.id)

  const commit = (next: GameRun) => {
    setRun(next)
    saveRun(next)
  }

  /** 1–2. Make the prediction from earlier rounds, lock it, save it. Only then show the board. */
  const enterRound = useCallback(
    (activeRun: GameRun, i: number) => {
      const spec = ROUNDS[i]
      let next = activeRun
      if (!activeRun.rounds.some((r) => r.roundId === spec.id)) {
        const order = displayOrderFor(spec, activeRun.id)
        const earlier = activeRun.rounds.filter((r) => r.status !== 'locked')
        const prediction = makePrediction(spec, earlier, activeRun.id, order)
        const locked: RoundRecord = {
          roundId: spec.id,
          level: spec.level,
          kind: spec.kind,
          displayOrder: order,
          prediction,
          status: 'locked',
          choice: null,
          correct: null,
        }
        next = { ...activeRun, rounds: [...activeRun.rounds, locked] }
        commit(next) // saved before the player can choose
      }
      setIndex(i)
      busy.current = false
      setStage('thinking')
    },
    [],
  )

  // The "thinking" beat is purely visual: the prediction above is already fixed.
  useEffect(() => {
    if (stage !== 'thinking') return
    const ms = round?.level === 4 ? 650 : 1100
    const id = window.setTimeout(() => {
      shownAt.current = performance.now()
      setStage('choosing')
    }, ms)
    return () => window.clearTimeout(id)
  }, [stage, round?.level])

  /** 3–5. Record the choice (or a timeout) against the locked prediction. */
  const choose = useCallback(
    (choice: string | null) => {
      if (stage !== 'choosing' || busy.current || !run || !round) return
      const locked = run.rounds.find((r) => r.roundId === round.id)
      if (!locked || locked.status !== 'locked') return
      busy.current = true
      const scored = scoreRound(locked, choice, Math.round(performance.now() - shownAt.current))
      commit({ ...run, rounds: run.rounds.map((r) => (r.roundId === round.id ? scored : r)) })
      setStage('reveal')
    },
    [stage, run, round],
  )

  /** 6–7. Move on: next level intro, next round, or the results. */
  const next = () => {
    if (!run) return
    const i = index + 1
    if (i >= TOTAL_ROUNDS) {
      commit({ ...run, completedAt: new Date().toISOString() })
      setStage('finishing')
      return
    }
    if (ROUNDS[i].level !== ROUNDS[index].level) {
      setIndex(i)
      setStage('level-intro')
    } else {
      enterRound(run, i)
    }
  }

  const start = () => {
    const fresh = createRun(challenge)
    setRun(fresh)
    setIndex(0)
    setStage('level-intro')
  }

  const resume = () => {
    if (!run) return
    const i = nextIndex(run)
    const firstOfLevel = ROUNDS.findIndex((r) => r.level === ROUNDS[i].level) === i
    const hasLock = run.rounds.some((r) => r.roundId === ROUNDS[i].id)
    setIndex(i)
    if (firstOfLevel && !hasLock) setStage('level-intro')
    else enterRound(run, i)
  }

  const abandon = () => {
    setCurrentRunId(null)
    setRun(null)
    setIndex(0)
    setStage('start')
  }

  // Each new screen starts at the top (important on phones). The "choosing" beat keeps the scroll position.
  useEffect(() => {
    if (stage !== 'choosing') window.scrollTo({ top: 0 })
  }, [stage, index])

  useEffect(() => {
    if (stage !== 'finishing') return
    const id = window.setTimeout(() => navigate('/results'), 1800)
    return () => window.clearTimeout(id)
  }, [stage, navigate])

  /* ───────────── Render ───────────── */

  if (stage === 'start') {
    return <StartScreen run={run} challenge={challenge} onStart={start} onResume={resume} onAbandon={abandon} canStore={canStore} />
  }

  if (stage === 'finishing') {
    return (
      <Frame>
        <div className="flex min-h-[50vh] flex-col justify-center" role="status" aria-live="polite">
          <AgentLabel who="algorithm">Final analysis</AgentLabel>
          <ul className="mt-8 space-y-3 font-mono text-sm text-ink-2">
            {['Counting correct predictions', 'Comparing with random guessing', 'Verifying every lock code', 'Writing your report'].map((line, i) => (
              <li key={line} className="animate-enter" style={{ animationDelay: `${i * 320}ms` }}>
                <span className="mr-3 text-muted">{String(i + 1).padStart(2, '0')}</span>
                {line}…
              </li>
            ))}
          </ul>
          <h1 className="display mt-12 text-4xl sm:text-6xl">The results are in.</h1>
        </div>
      </Frame>
    )
  }

  if (!run || !round) return null

  if (stage === 'level-intro') {
    return (
      <Frame>
        <div className="mb-10"><LevelTrack level={round.level} roundIndex={index} /></div>
        <LevelIntro level={round.level} rounds={run.rounds} onStart={() => enterRound(run, index)} />
      </Frame>
    )
  }

  const nextIsNewLevel = index + 1 < TOTAL_ROUNDS && ROUNDS[index + 1].level !== round.level
  const nextLabel = index + 1 >= TOTAL_ROUNDS ? 'See the final results' : nextIsNewLevel ? `On to level ${ROUNDS[index + 1].level}` : 'Next round'

  return (
    <Frame>
      <div className="space-y-4">
        <LevelTrack level={round.level} roundIndex={index} />
        <Scoreboard rounds={run.rounds} level={round.level} duelLength={DUEL_LENGTH} />
      </div>

      {!canStore && (
        <div className="mt-6">
          <Notice tone="warn">Your browser is blocking storage, so this run can’t be saved if you leave the page.</Notice>
        </div>
      )}

      <div className="mt-8">
        {stage === 'reveal' && record ? (
          <RoundReveal
            key={record.roundId}
            round={round}
            record={record}
            rounds={run.rounds}
            runId={run.id}
            nextLabel={nextLabel}
            compact={round.level === 4}
            onNext={next}
          />
        ) : record ? (
          <div key={round.id} className="space-y-8">
            <PredictionPanel round={round} prediction={record.prediction} thinking={stage === 'thinking'} movesSeen={run.rounds.filter((r) => r.status === 'answered').length} />

            <section aria-labelledby="your-move" className="animate-enter">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <AgentLabel who="human">Your move</AgentLabel>
                  <h1 id="your-move" className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{round.prompt}</h1>
                  {round.level === 4 && <p className="mt-1 text-sm text-ink-2">Pick the direction it didn’t predict.</p>}
                </div>
                {round.timerSeconds && (
                  <Countdown key={round.id} seconds={round.timerSeconds} running={stage === 'choosing'} onExpire={() => choose(null)} />
                )}
              </div>
              <ChoiceBoard round={round} displayOrder={record.displayOrder} disabled={stage !== 'choosing'} onChoose={choose} />
              {stage === 'thinking' && <p className="mt-3 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-muted">Waiting for the prediction to lock…</p>}
            </section>
          </div>
        ) : null}
      </div>

      <details className="mt-14 border-t border-line pt-6">
        <summary className="cursor-pointer font-mono text-xs uppercase tracking-[0.14em] text-ink-2 hover:text-ink">
          Prediction log ({run.rounds.filter((r) => r.status !== 'locked').length}) — check every round ▾
        </summary>
        <div className="mt-4"><PredictionLog rounds={run.rounds} runId={run.id} /></div>
      </details>
    </Frame>
  )
}

function Frame({ children }: { children: ReactNode }) {
  return <div className="container-page max-w-4xl pt-8 pb-16 md:pt-12">{children}</div>
}

/* ───────────── Start screen ───────────── */

function StartScreen({
  run,
  challenge,
  onStart,
  onResume,
  onAbandon,
  canStore,
}: {
  run: GameRun | null
  challenge?: ReturnType<typeof parseChallenge>
  onStart: () => void
  onResume: () => void
  onAbandon: () => void
  canStore: boolean
}) {
  const played = nextIndex(run)
  const steps = [
    { who: 'algorithm' as const, title: 'It predicts', text: 'From your earlier moves only. The prediction is locked with a fingerprint code before you choose.' },
    { who: 'human' as const, title: 'You choose', text: 'Pick whatever you like. You can’t see its prediction.' },
    { who: 'algorithm' as const, title: 'The reveal', text: 'Right or wrong, with the reason — and a lock code you can check.' },
    { who: 'algorithm' as const, title: 'It learns', text: 'Signals that predicted you well gain trust for the next round.' },
  ]

  return (
    <div className="container-page max-w-5xl pt-12 pb-16 md:pt-20">
      {challenge && (
        <div className="mb-10 animate-pop border border-human/60 bg-human/[0.06] px-5 py-4">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-human">You’ve been challenged</p>
          <p className="mt-2 font-display text-2xl tracking-tight">
            Your friend fooled the algorithm <span className="text-human">{challenge.fooled} of {challenge.duel}</span> times in the final duel. Can you beat that?
          </p>
          <p className="mt-1 text-xs text-muted">Score shared through the link — not verified by this site.</p>
        </div>
      )}

      <div className="flex items-center gap-4" aria-hidden="true">
        <AlgorithmMark className="h-8 w-8" />
        <span className="font-mono text-sm text-muted">vs</span>
        <HumanMark className="h-8 w-8" />
      </div>
      <h1 className="display mt-6 animate-enter text-[3rem] sm:text-7xl lg:text-8xl">
        Human
        <br />
        <span className="text-ink-2">vs</span> Algorithm
      </h1>
      <p className="mt-6 max-w-2xl font-display text-2xl tracking-tight text-ink-2 sm:text-3xl">Can an algorithm predict what you’ll do next?</p>

      {!canStore && (
        <div className="mt-8 max-w-2xl"><Notice tone="warn">Your browser is blocking storage. The game works, but progress is lost if you leave the page.</Notice></div>
      )}

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        {run && played > 0 ? (
          <>
            <button type="button" className="btn btn-primary" onClick={onResume}>
              Continue — round {Math.min(played + 1, TOTAL_ROUNDS)} of {TOTAL_ROUNDS} <span aria-hidden="true">→</span>
            </button>
            <button type="button" className="btn btn-ghost" onClick={onAbandon}>Start over</button>
          </>
        ) : (
          <button type="button" className="btn btn-primary" onClick={onStart}>
            {challenge ? 'Accept the challenge' : 'Start the game'} <span aria-hidden="true">→</span>
          </button>
        )}
      </div>
      <p className="mt-5 font-mono text-[0.7rem] tracking-wide text-muted">{TOTAL_ROUNDS} rounds · 4 levels · about 4 minutes · anonymous · no sign-up</p>

      <ol className="mt-16 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.title} className="flex flex-col bg-bg p-5">
            <span className="flex items-center justify-between">
              <AgentLabel who={s.who}>{s.who === 'algorithm' ? 'Algorithm' : 'You'}</AgentLabel>
              <span className="font-mono text-xs text-muted">{i + 1}</span>
            </span>
            <span className="mt-5 font-display text-xl font-semibold tracking-tight">{s.title}</span>
            <span className="mt-2 text-sm leading-relaxed text-ink-2">{s.text}</span>
          </li>
        ))}
      </ol>

      <div className="mt-12">
        <p className="eyebrow mb-4">Four levels</p>
        <ol className="divide-y divide-line border-y border-line">
          {LEVELS.map((l) => (
            <li key={l.level} className="grid grid-cols-[3rem_1fr] gap-x-4 py-4 sm:grid-cols-[3rem_14rem_1fr]">
              <span className={`font-mono text-sm ${l.level === 4 ? 'text-signal' : 'text-muted'}`}>{l.level}/4</span>
              <span className={`font-display text-lg font-semibold tracking-tight ${l.level === 4 ? 'text-signal' : ''}`}>{l.name}</span>
              <span className="col-start-2 text-sm leading-relaxed text-ink-2 sm:col-start-3">{l.tagline}</span>
            </li>
          ))}
        </ol>
      </div>

      <p className="mt-10 max-w-2xl text-xs leading-relaxed text-muted">
        An interactive experiment, not a personality test. Your moves are stored only in this browser.{' '}
        <Link className="underline underline-offset-2 hover:text-ink" to="/about#methodology">How the algorithm works</Link>
      </p>
    </div>
  )
}
