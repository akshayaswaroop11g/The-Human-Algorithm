import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="container-page flex flex-col gap-6 py-10 md:flex-row md:items-end md:justify-between">
        <div className="max-w-md">
          <p className="eyebrow mb-3">The Human Algorithm · v0.1 experimental</p>
          <p className="text-sm leading-relaxed text-muted">
            An interactive experiment in behavioral economics. Not a personality test, not a diagnostic tool.
            Anonymous by design — your answers are stored only in this browser.
          </p>
        </div>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted">
          <li><Link className="hover:text-ink" to="/about#methodology">Methodology</Link></li>
          <li><Link className="hover:text-ink" to="/about#limitations">Limitations</Link></li>
          <li><Link className="hover:text-ink" to="/about#privacy">Privacy</Link></li>
        </ul>
      </div>
    </footer>
  )
}
