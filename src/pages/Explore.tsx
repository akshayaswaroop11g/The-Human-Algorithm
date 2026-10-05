/**
 * EXPLORE THE DATA — "What do humans choose?"
 * Aggregated, anonymous counts only. Filter by category, experiment or scenario.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import SplitBar from '../components/charts/SplitBar'
import TimeBars from '../components/charts/TimeBars'
import { DataSourceBadge, DataSourceToggle, useAggregate } from '../components/DataSource'
import DeviceGames from '../components/game/DeviceGames'
import { SectionHeader, Stat } from '../components/Section'
import { EXPERIMENTS } from '../data/experiments'
import { SCENARIOS, scenarioNumber } from '../data/scenarios'
import type { Category } from '../types'
import { getLatestSession } from '../utils/storage'

const ALL = 'all'

export default function Explore() {
  const { source, setSource, aggregate } = useAggregate()
  const [category, setCategory] = useState<string>(ALL)
  const [experiment, setExperiment] = useState<string>(ALL)
  const [scenarioId, setScenarioId] = useState<string>(ALL)
  const [latest] = useState(getLatestSession)

  const categories = useMemo(() => [...new Set(SCENARIOS.map((s) => s.category))].sort() as Category[], [])

  const visible = SCENARIOS.filter((s) => {
    if (category !== ALL && s.category !== category) return false
    if (experiment !== ALL && !EXPERIMENTS.find((e) => e.slug === experiment)?.scenarioIds.includes(s.id)) return false
    if (scenarioId !== ALL && s.id !== scenarioId) return false
    return true
  })

  const yourChoice = (id: string) => (source === 'device' ? latest?.responses.find((r) => r.scenarioId === id)?.selectedOption : undefined)

  // The most evenly split scenario (closest to 50/50) with at least some answers.
  const mostDivided = SCENARIOS.map((s) => aggregate.perScenario[s.id])
    .filter((a) => a.shareA !== null && a.n >= 2)
    .sort((a, b) => Math.abs(a.shareA! - 0.5) - Math.abs(b.shareA! - 0.5))[0]
  const mostDividedScenario = mostDivided && SCENARIOS.find((s) => s.id === mostDivided.scenarioId)

  const filtersActive = category !== ALL || experiment !== ALL || scenarioId !== ALL
  const selectClass =
    'min-h-11 w-full appearance-none border border-line-strong bg-bg px-3 pr-8 font-mono text-xs text-ink hover:border-ink-2 bg-[length:10px] bg-[right_12px_center] bg-no-repeat'
  const chevron = { backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%238c8c86' fill='none'/%3E%3C/svg%3E\")" }

  return (
    <div className="pb-8">
      <section className="container-page pt-12 pb-12 md:pt-20">
        <p className="eyebrow mb-6">Explore the data</p>
        <h1 className="display animate-enter text-[3rem] sm:text-7xl lg:text-8xl">
          What do
          <br />
          humans choose?
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink-2">
          Every scenario, every split. Aggregated and anonymous — no individual answers are shown.
        </p>
      </section>

      <DeviceGames />

      <section className="container-page">
        <p className="eyebrow mb-4">Dilemmas · how people traded money, time and risk</p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <DataSourceToggle source={source} onChange={setSource} />
          <div className="lg:max-w-xl">
            <DataSourceBadge source={source} participants={aggregate.participants} />
          </div>
        </div>
      </section>

      {aggregate.participants === 0 ? (
        <section className="container-page pt-12">
          <div className="grid-bg border border-line px-6 py-16 text-center md:py-24">
            <p className="eyebrow mb-5">No data yet · 0 sessions</p>
            <p className="display text-3xl sm:text-4xl">No real responses recorded on this device.</p>
            <p className="mx-auto mt-5 max-w-md text-ink-2">Take the experiment to add the first one, or switch to the synthetic sample to preview the charts.</p>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/experiment" className="btn btn-primary">Start the experiment</Link>
              <button type="button" className="btn btn-ghost" onClick={() => setSource('sample')}>View sample data</button>
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* Overview */}
          <section className="container-page pt-12" aria-label="Overview">
            <dl className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
              <Stat label={source === 'sample' ? 'Simulated participants' : 'Sessions'} value={aggregate.participants} />
              <Stat label="Decisions recorded" value={aggregate.decisions.toLocaleString()} />
              <Stat
                label="Model accuracy"
                value={aggregate.modelAccuracy === null ? '—' : `${Math.round(aggregate.modelAccuracy * 100)}%`}
                note={`across ${aggregate.predictionsMade.toLocaleString()} predictions`}
              />
              <Stat
                label="Most divided decision"
                value={mostDividedScenario ? mostDividedScenario.title : '—'}
                note={mostDivided && mostDivided.shareA !== null ? `${Math.round(mostDivided.shareA * 100)}% / ${100 - Math.round(mostDivided.shareA * 100)}% split` : 'Needs at least 2 responses'}
              />
            </dl>
          </section>

          {/* Filters + results */}
          <section className="container-page pt-20" aria-labelledby="splits-title">
            <SectionHeader index="01 · Choices" title="Scenario by scenario" id="splits-title">
              Each bar shows how responses divided between the two options.
              {source === 'device' && latest && ' Your own choice is marked ◆.'}
            </SectionHeader>

            <div style={{ top: "calc(env(safe-area-inset-top, 0px) + 4rem)" }} className="sticky z-10 -mx-4 mb-4 border-y border-line bg-bg/90 px-4 py-4 backdrop-blur-md sm:mx-0 sm:border-x">
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="flex flex-col gap-1.5">
                  <span className="eyebrow">Category</span>
                  <select className={selectClass} style={chevron} value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value={ALL}>All categories</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="eyebrow">Experiment</span>
                  <select className={selectClass} style={chevron} value={experiment} onChange={(e) => setExperiment(e.target.value)}>
                    <option value={ALL}>All experiments</option>
                    {EXPERIMENTS.map((e) => <option key={e.slug} value={e.slug}>{e.title}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="eyebrow">Scenario</span>
                  <select className={selectClass} style={chevron} value={scenarioId} onChange={(e) => setScenarioId(e.target.value)}>
                    <option value={ALL}>All scenarios</option>
                    {SCENARIOS.map((s, i) => <option key={s.id} value={s.id}>#{String(i + 1).padStart(2, '0')} {s.title}</option>)}
                  </select>
                </label>
              </div>
              <p className="mt-3 flex items-center justify-between font-mono text-[0.68rem] uppercase tracking-[0.12em] text-muted" aria-live="polite">
                <span>Showing {visible.length} of {SCENARIOS.length} scenarios</span>
                {filtersActive && (
                  <button type="button" className="text-ink-2 underline-offset-2 hover:text-ink hover:underline" onClick={() => { setCategory(ALL); setExperiment(ALL); setScenarioId(ALL) }}>
                    Clear filters
                  </button>
                )}
              </p>
            </div>

            {visible.length === 0 ? (
              <p className="border border-dashed border-line p-8 text-center text-ink-2">No scenarios match these filters.</p>
            ) : (
              <div className="divide-y divide-line">
                {visible.map((s) => {
                  const agg = aggregate.perScenario[s.id]
                  return <SplitBar key={s.id} scenario={s} shareA={agg.shareA} n={agg.n} yourChoice={yourChoice(s.id)} number={scenarioNumber(s.id)} />
                })}
              </div>
            )}
          </section>

          {/* Timing */}
          <section className="container-page pt-20" aria-labelledby="time-title">
            <SectionHeader index="02 · Hesitation" title="Which decisions take longest?" id="time-title">
              Median seconds to decide, by category. Longer times may reflect harder trade-offs — or simply longer text. Treat as a weak signal.
            </SectionHeader>
            <TimeBars
              horizontal
              data={aggregate.categoryTimes.map((c) => ({ label: c.category, seconds: c.medianSeconds }))}
              height={Math.max(180, aggregate.categoryTimes.length * 30)}
              ariaLabel="Horizontal bar chart of median decision time by scenario category."
            />
          </section>
        </>
      )}
    </div>
  )
}
