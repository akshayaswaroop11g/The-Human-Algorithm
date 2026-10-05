import type { ReactNode } from 'react'

/** Consistent section heading: a numbered mono label, a large title, optional intro text. */
export function SectionHeader({ index, title, children, id }: { index: string; title: string; children?: ReactNode; id?: string }) {
  return (
    <header className="mb-10 grid gap-4 md:grid-cols-12 md:gap-8">
      <p className="eyebrow md:col-span-3 md:pt-3">{index}</p>
      <div className="md:col-span-9">
        <h2 id={id} className="display text-4xl sm:text-5xl">{title}</h2>
        {children && <div className="mt-5 max-w-2xl leading-relaxed text-ink-2">{children}</div>}
      </div>
    </header>
  )
}

/** A labelled number, used in stat rows. */
export function Stat({ label, value, note }: { label: string; value: ReactNode; note?: ReactNode }) {
  return (
    <div className="flex flex-col bg-bg p-5 sm:p-6">
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-4 font-display text-3xl font-semibold tabular tracking-tight sm:text-4xl">{value}</dd>
      {note && <dd className="mt-2 text-xs leading-relaxed text-muted">{note}</dd>}
    </div>
  )
}
