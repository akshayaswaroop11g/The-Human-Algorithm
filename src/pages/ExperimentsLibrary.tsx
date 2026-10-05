import { Link } from 'react-router-dom'
import { EXPERIMENTS } from '../data/experiments'

export default function ExperimentsLibrary() {
  return (
    <div className="pb-8">
      <section className="container-page pt-12 pb-14 md:pt-20">
        <p className="eyebrow mb-6">Experiment library</p>
        <h1 className="display animate-enter text-[3rem] sm:text-7xl lg:text-8xl">Experiments</h1>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink-2">
          Each investigation asks one question about how people trade things off, using a small set of the scenarios from the main experiment.
        </p>
      </section>

      <section className="container-page">
        <ul className="grid gap-px border border-line bg-line md:grid-cols-2">
          {EXPERIMENTS.map((e, i) => (
            <li key={e.slug} className="animate-enter bg-bg" style={{ animationDelay: `${i * 70}ms` }}>
              <Link to={`/experiments/${e.slug}`} className="group flex h-full min-h-72 flex-col p-6 transition-colors hover:bg-surface sm:p-8">
                <span className="flex items-center justify-between">
                  <span className="eyebrow">{e.index}</span>
                  <span className="eyebrow">{e.scenarioIds.length} scenarios</span>
                </span>
                <span className="display mt-10 text-3xl sm:text-4xl">{e.title}</span>
                <span className="mt-4 max-w-sm leading-relaxed text-ink-2">{e.question}</span>
                <span className="mt-auto flex items-center gap-2 pt-8 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted transition-colors group-hover:text-ink">
                  Open investigation <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
                </span>
              </Link>
            </li>
          ))}
          {/* Fills the grid's last cell with an invitation instead of a hole. */}
          <li className="hidden bg-bg md:block">
            <div className="grid-bg flex h-full min-h-72 flex-col justify-end p-8">
              <p className="eyebrow mb-3">E-06 · Proposed</p>
              <p className="max-w-sm leading-relaxed text-muted">
                New investigations can be added in <code className="font-mono text-xs text-ink-2">src/data/experiments.ts</code>.
              </p>
            </div>
          </li>
        </ul>
      </section>
    </div>
  )
}
