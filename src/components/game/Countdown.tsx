import { useEffect, useRef, useState } from 'react'

/**
 * Pressure-round timer: a ring that drains, with the seconds in the middle.
 * Calls onExpire exactly once when time runs out (unless stopped first).
 */
export default function Countdown({ seconds, running, onExpire }: { seconds: number; running: boolean; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(seconds * 1000)
  const fired = useRef(false)
  const expire = useRef(onExpire)
  expire.current = onExpire

  useEffect(() => {
    if (!running) return
    // Wall-clock based, so the deadline holds even if the tab is in the background.
    const start = Date.now()
    const id = window.setInterval(() => {
      const left = Math.max(0, seconds * 1000 - (Date.now() - start))
      setRemaining(left)
      if (left <= 0) {
        window.clearInterval(id)
        if (!fired.current) {
          fired.current = true
          expire.current()
        }
      }
    }, 50)
    return () => window.clearInterval(id)
  }, [running, seconds])

  const fraction = remaining / (seconds * 1000)
  const whole = Math.ceil(remaining / 1000)
  const urgent = remaining < 1500
  const r = 26
  const circumference = 2 * Math.PI * r

  return (
    <div className="flex items-center gap-3" role="timer" aria-label={`${whole} seconds left`}>
      <svg viewBox="0 0 64 64" className={`h-14 w-14 ${urgent ? 'animate-pulse' : ''}`} aria-hidden="true">
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--color-line)" strokeWidth="4" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke={urgent ? 'var(--color-signal)' : 'var(--color-human)'}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
          transform="rotate(-90 32 32)"
        />
        <text x="32" y="39" textAnchor="middle" fontSize="20" fontFamily="var(--font-display)" fontWeight="600" fill="var(--color-ink)">
          {whole}
        </text>
      </svg>
      <span className={`font-mono text-[0.68rem] uppercase tracking-[0.14em] ${urgent ? 'text-signal' : 'text-muted'}`}>
        {urgent ? 'Hurry' : 'Seconds left'}
      </span>
    </div>
  )
}
