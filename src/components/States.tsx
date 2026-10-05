/**
 * Reusable empty / loading / error states so no page is ever a blank screen.
 */
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="container-page flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
      <p className="eyebrow flex items-center gap-3">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-signal" aria-hidden="true" />
        {label}
        <span className="animate-blink" aria-hidden="true">_</span>
      </p>
    </div>
  )
}

interface EmptyStateProps {
  code: string
  title: string
  children: ReactNode
  actions?: { to: string; label: string; primary?: boolean }[]
}

/** A centered panel with a label, a heading, a sentence and up to two actions. */
export function EmptyState({ code, title, children, actions = [] }: EmptyStateProps) {
  return (
    <section className="container-page py-24 md:py-32">
      <div className="grid-bg mx-auto max-w-2xl border border-line px-6 py-14 text-center md:px-12 md:py-20">
        <p className="eyebrow mb-6">{code}</p>
        <h1 className="display mb-5 text-4xl md:text-5xl">{title}</h1>
        <div className="mx-auto max-w-md text-[0.95rem] leading-relaxed text-ink-2">{children}</div>
        {actions.length > 0 && (
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            {actions.map((a) => (
              <Link key={a.to + a.label} to={a.to} className={`btn ${a.primary ? 'btn-primary' : 'btn-ghost'}`}>
                {a.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

/** Small inline notice, e.g. "storage unavailable". */
export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' }) {
  return (
    <div className={`flex gap-3 border px-4 py-3 text-sm ${tone === 'warn' ? 'border-signal/50 text-ink' : 'border-line text-ink-2'}`} role={tone === 'warn' ? 'alert' : 'note'}>
      <span className="eyebrow shrink-0 pt-0.5">{tone === 'warn' ? '! Note' : 'i Note'}</span>
      <div>{children}</div>
    </div>
  )
}
