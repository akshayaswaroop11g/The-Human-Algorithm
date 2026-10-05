import { Link } from 'react-router-dom'
import DecisionTree from '../components/DecisionTree'
import { AgentLabel, AlgorithmMark, HumanMark } from '../components/game/Agents'
import { LEVELS, TOTAL_ROUNDS } from '../game/levels'
import { getCurrentRun } from '../utils/storage'

const LOOP = [
  { step: 'Predict', who: 'algorithm' as const, text: 'Using only your earlier moves, the algorithm picks what it thinks you’ll do.' },
  { step: 'Lock', who: 'algorithm' as const, text: 'The prediction is sealed with a fingerprint code — shown before you choose.' },
  { step: 'Choose', who: 'human' as const, text: 'You pick. You can’t see its prediction, so you can’t be steered by it.' },
  { step: 'Reveal', who: 'algorithm' as const, text: 'Right or wrong, with the reason — and a code you can check.' },
  { step: 'Learn', who: 'algorithm' as const, text: 'Signals that predicted you well gain trust. Then it predicts again.' },
]

export default function Home() {
  const run = getCurrentRun()
  const inProgress = run && !run.completedAt && run.rounds.some((r) => r.status !== 'locked')

  return (
    <>
      {/* ───────────── Hero ───────────── */}
      <section className="container-page grid items-center gap-12 pt-14 pb-20 md:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-8 lg:pt-24">
        <div className="animate-enter">
          <p className="eyebrow mb-8 flex items-center gap-3">
            <AlgorithmMark className="h-4 w-4" />
            <span>Human vs Algorithm</span>
            <HumanMark className="h-4 w-4" />
          </p>
          <h1 className="display text-[3.1rem] sm:text-7xl lg:text-[5.6rem]">
            The Human
            <br />
            Algorithm
          </h1>
          <p className="mt-6 font-display text-2xl tracking-tight text-ink-2 sm:text-3xl">Can an algorithm predict what you’ll do next?</p>
          <div className="mt-10 max-w-lg space-y-4 text-[1.02rem] leading-relaxed text-ink-2">
            <p>We make thousands of decisions every day, and we think most of them are our own. Some follow patterns we never notice.</p>
            <p className="text-ink">Here, an algorithm locks in a prediction before every move you make. Then you find out whether it was right — and try to beat it.</p>
          </div>
          <div className="mt-12 flex flex-col gap-3 sm:flex-row">
            <Link to="/experiment" className="btn btn-primary group">
              {inProgress ? 'Continue your game' : 'Play against the algorithm'}
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <Link to="/explore" className="btn btn-ghost">Explore the data</Link>
          </div>
          <p className="mt-6 font-mono text-[0.7rem] tracking-wide text-muted">
            {TOTAL_ROUNDS} rounds · 4 levels · about 4 minutes · anonymous · no sign-up
          </p>
        </div>

        <div className="animate-fade [animation-delay:200ms]">
          <DecisionTree />
        </div>
      </section>

      {/* ───────────── The honesty problem ───────────── */}
      <section className="border-y border-line bg-surface">
        <div className="container-page grid gap-10 py-20 md:grid-cols-12 md:py-28">
          <p className="eyebrow md:col-span-3">The obvious question</p>
          <div className="md:col-span-9">
            <p className="display text-3xl leading-[1.08] sm:text-5xl">“How do I know it didn’t just claim it was right?”</p>
            <p className="mt-8 max-w-2xl leading-relaxed text-ink-2">
              Before you choose, the algorithm commits to its prediction and shows you a lock code: a SHA-256 fingerprint of that prediction
              plus a secret. After you choose, it reveals both. Change the prediction by a single letter and the code no longer matches — so it
              can’t change its answer after seeing yours. Every round is listed at the end, with its code, next to what random guessing would have
              scored.
            </p>
            <div className="mt-10 grid max-w-2xl gap-px border border-line bg-line sm:grid-cols-2" aria-label="Example of a locked prediction and its reveal">
              <div className="bg-bg p-5">
                <AgentLabel who="algorithm">Before you choose</AgentLabel>
                <p className="mt-3 font-display text-xl tracking-tight">Prediction locked</p>
                <p className="mt-1 font-mono text-sm text-ink">3f9a·c2d1·77e0</p>
              </div>
              <div className="bg-bg p-5">
                <AgentLabel who="human">After you choose</AgentLabel>
                <p className="mt-3 font-display text-xl tracking-tight">Predicted: Left</p>
                <p className="mt-1 font-mono text-sm text-muted">sha256(…|left|9c1e…) = 3f9a·c2d1·77e0 ✓</p>
              </div>
            </div>
            <p className="mt-2 font-mono text-[0.66rem] uppercase tracking-[0.12em] text-muted">Illustration — real codes are generated in the game</p>
          </div>
        </div>
      </section>

      {/* ───────────── The loop ───────────── */}
      <section className="container-page py-20 md:py-28">
        <div className="mb-12 flex items-end justify-between gap-6">
          <h2 className="display text-4xl sm:text-5xl">Every round</h2>
          <p className="eyebrow hidden sm:block">Same protocol, {TOTAL_ROUNDS} times</p>
        </div>
        <ol className="grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
          {LOOP.map((item, i) => (
            <li key={item.step} className="flex flex-col bg-bg p-6 lg:min-h-56">
              <span className="flex items-center justify-between">
                <AgentLabel who={item.who}>{item.who === 'algorithm' ? 'Algorithm' : 'You'}</AgentLabel>
                <span className="font-mono text-xs text-muted">{i + 1}</span>
              </span>
              <span className={`mt-6 font-display text-2xl tracking-tight ${item.who === 'human' ? 'text-human' : ''}`}>{item.step}</span>
              <span className="mt-3 text-sm leading-relaxed text-ink-2">{item.text}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* ───────────── Levels ───────────── */}
      <section className="container-page pb-20 md:pb-28">
        <h2 className="display mb-10 text-4xl sm:text-5xl">Four levels</h2>
        <ol className="divide-y divide-line border-y border-line">
          {LEVELS.map((l) => (
            <li key={l.level} className="grid gap-x-8 gap-y-2 py-6 md:grid-cols-[4rem_16rem_1fr]">
              <span className={`font-mono text-sm ${l.level === 4 ? 'text-signal' : 'text-muted'}`}>{l.level}/4</span>
              <span className={`font-display text-2xl font-semibold tracking-tight ${l.level === 4 ? 'text-signal' : ''}`}>{l.name}</span>
              <span className="leading-relaxed text-ink-2">{l.description}</span>
            </li>
          ))}
        </ol>
        <div className="mt-10">
          <Link to="/experiment" className="btn btn-primary">Start level 1 <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      {/* ───────────── What it is / isn't ───────────── */}
      <section className="container-page grid gap-6 pb-8 md:grid-cols-2">
        <div className="border border-line p-8">
          <p className="eyebrow mb-4">What this is</p>
          <p className="leading-relaxed text-ink-2">
            An interactive experiment with a small, transparent prediction model. Its signals are simple rules — favorites, repeat-or-switch
            habits, remembered sequences — and you see which one it used every round.
          </p>
        </div>
        <div className="border border-line p-8">
          <p className="eyebrow mb-4">What this isn’t</p>
          <p className="leading-relaxed text-ink-2">
            A personality test, a diagnosis or a judgement. A predictability score describes how well <em>this</em> model matched{' '}
            <em>your moves in this game</em> — nothing more.
          </p>
        </div>
      </section>
    </>
  )
}
