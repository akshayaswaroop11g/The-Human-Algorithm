import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/experiment', label: 'Play' },
  { to: '/results', label: 'Your Results' },
  { to: '/explore', label: 'Explore the Data' },
  { to: '/experiments', label: 'Experiments' },
  { to: '/about', label: 'About' },
]

export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M4 12h6l5-6M10 12l5 6" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <circle cx="4" cy="12" r="2.2" fill="var(--color-signal)" />
      <circle cx="16" cy="5.5" r="1.7" fill="currentColor" />
      <circle cx="16" cy="18.5" r="1.7" fill="currentColor" />
    </svg>
  )
}

export default function NavBar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  // Close the mobile menu whenever the page changes.
  useEffect(() => setOpen(false), [location.pathname])

  // Close it with the Escape key.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `font-mono text-[0.72rem] uppercase tracking-[0.14em] transition-colors ${
      isActive ? 'text-ink' : 'text-muted hover:text-ink'
    }`

  return (
    <header style={{ top: 'env(safe-area-inset-top, 0px)' }} className="sticky z-40 border-b border-line bg-bg/85 backdrop-blur-md">
      <nav className="container-page flex h-16 items-center justify-between" aria-label="Main">
        <Link to="/" className="flex items-center gap-3 text-ink" aria-label="The Human Algorithm — home">
          <LogoMark className="h-6 w-6" />
          <span className="font-display text-[0.95rem] font-semibold tracking-tight">The Human Algorithm</span>
        </Link>

        <ul className="hidden items-center gap-7 lg:flex">
          {LINKS.slice(1).map((l) => (
            <li key={l.to}>
              <NavLink to={l.to} className={linkClass}>
                {({ isActive }) => (
                  <span className="relative">
                    {l.label}
                    {isActive && <span className="absolute -bottom-[23px] left-0 right-0 h-px bg-ink" aria-hidden="true" />}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="relative block h-3 w-5" aria-hidden="true">
            <span className={`absolute left-0 h-px w-5 bg-ink transition-transform duration-300 ${open ? 'top-1.5 rotate-45' : 'top-0'}`} />
            <span className={`absolute left-0 h-px w-5 bg-ink transition-transform duration-300 ${open ? 'top-1.5 -rotate-45' : 'top-3'}`} />
          </span>
        </button>
      </nav>

      {open && (
        <div id="mobile-menu" className="animate-fade border-t border-line bg-bg lg:hidden">
          <ul className="container-page py-4">
            {LINKS.map((l, i) => (
              <li key={l.to} className="border-b border-line last:border-0">
                <NavLink
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    `flex items-baseline gap-4 py-4 font-display text-2xl tracking-tight ${isActive ? 'text-ink' : 'text-ink-2'}`
                  }
                >
                  <span className="font-mono text-xs text-muted">{String(i + 1).padStart(2, '0')}</span>
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  )
}
