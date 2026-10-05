import { Link, useParams } from 'react-router-dom'
import SplitBar from '../components/charts/SplitBar'
import { DataSourceBadge, DataSourceToggle, useAggregate } from '../components/DataSource'
import { SectionHeader } from '../components/Section'
import { EmptyState } from '../components/States'
import { EXPERIMENTS, getExperiment } from '../data/experiments'
import { getScenario, scenarioNumber } from '../data/scenarios'
import type { Scenario } from '../types'

export default function ExperimentDetail() {
  const { slug = '' } = useParams()
  const experiment = getExperiment(slug)
  const { source, setSource, aggregate } = useAggregate()

  if (!experiment) {
    return (
      <EmptyState code="404 · Unknown experiment" title="No such investigation." actions={[{ to: '/experiments', label: 'All experiments', primary: true }]}>
        <p>This experiment doesn’t exist, or its address has changed.</p>
      </EmptyState>
    )
  }

  const scenarios = experiment.scenarioIds.map(getScenario).filter((s): s is Scenario => !!s)
  const position = EXPERIMENTS.findIndex((e) => e.slug === experiment.slug)
  const next = EXPERIMENTS[(position + 1) % EXPERIMENTS.length]

  return (
    <div className="pb-8">
      <section className="container-page pt-10 pb-14 md:pt-16">
        <Link to="/experiments" className="eyebrow mb-10 inline-flex items-center gap-2 hover:text-ink">
          <span aria-hidden="true">←</span> All experiments
        </Link>
        <p className="eyebrow mb-6">{experiment.index} · Research question</p>
        <h1 className="display animate-enter text-[2.8rem] sm:text-7xl">{experiment.title}</h1>
        <p className="mt-6 max-w-3xl font-display text-2xl leading-snug tracking-tight text-ink-2 sm:text-3xl">{experiment.question}</p>
        <p className="mt-8 max-w-2xl leading-relaxed text-ink-2">{experiment.summary}</p>
      </section>

      {/* Scenarios */}
      <section className="container-page pt-8" aria-labelledby="scen-title">
        <SectionHeader index="01 · Scenarios" title="What participants see" id="scen-title" />
        <ol className="grid gap-px border border-line bg-line sm:grid-cols-2">
          {scenarios.map((s) => (
            <li key={s.id} className="bg-bg p-6">
              <p className="eyebrow mb-3">#{String(scenarioNumber(s.id)).padStart(2, '0')} · {s.category}</p>
              <p className="font-display text-xl font-semibold tracking-tight">{s.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{s.prompt}</p>
              <p className="mt-4 font-mono text-xs text-muted">
                A · {s.options[0].label}{s.options[0].facts ? ` (${s.options[0].facts.join(', ')})` : ''}
                <br />
                B · {s.options[1].label}{s.options[1].facts ? ` (${s.options[1].facts.join(', ')})` : ''}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Results */}
      <section className="container-page pt-20" aria-labelledby="res-title">
        <SectionHeader index="02 · Current results" title="How people chose" id="res-title" />
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <DataSourceToggle source={source} onChange={setSource} />
          <div className="lg:max-w-xl"><DataSourceBadge source={source} participants={aggregate.participants} /></div>
        </div>
        {aggregate.participants === 0 ? (
          <div className="border border-dashed border-line p-8 text-center">
            <p className="text-ink-2">No real responses on this device yet.</p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/experiment" className="btn btn-primary">Take the experiment</Link>
              <button type="button" className="btn btn-ghost" onClick={() => setSource('sample')}>Preview with sample data</button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {scenarios.map((s) => {
              const agg = aggregate.perScenario[s.id]
              return <SplitBar key={s.id} scenario={s} shareA={agg.shareA} n={agg.n} number={scenarioNumber(s.id)} />
            })}
          </div>
        )}
      </section>

      {/* Methodology + limitations */}
      <section className="container-page grid gap-6 pt-20 md:grid-cols-2">
        <div className="border border-line p-6 sm:p-8">
          <p className="eyebrow mb-6">03 · Methodology</p>
          <ol className="space-y-4">
            {experiment.methodology.map((m, i) => (
              <li key={m} className="flex gap-4 leading-relaxed text-ink-2">
                <span className="font-mono text-xs text-muted">{String(i + 1).padStart(2, '0')}</span>
                {m}
              </li>
            ))}
          </ol>
        </div>
        <div className="border border-line p-6 sm:p-8">
          <p className="eyebrow mb-6">04 · Limitations</p>
          <ul className="space-y-4">
            {experiment.limitations.map((l) => (
              <li key={l} className="flex gap-4 leading-relaxed text-ink-2">
                <span className="font-mono text-xs text-muted" aria-hidden="true">—</span>
                {l}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container-page pt-16">
        <Link to={`/experiments/${next.slug}`} className="group flex items-center justify-between border-t border-line pt-8">
          <span>
            <span className="eyebrow block">Next · {next.index}</span>
            <span className="display mt-3 block text-3xl">{next.title}</span>
          </span>
          <span aria-hidden="true" className="text-2xl transition-transform group-hover:translate-x-1">→</span>
        </Link>
      </section>
    </div>
  )
}
