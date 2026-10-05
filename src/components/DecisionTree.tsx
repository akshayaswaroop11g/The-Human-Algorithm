/**
 * The homepage visual: one DECISION branching into six influences, each
 * branching into two concrete outcomes taken from the actual scenarios.
 *
 * Every few seconds the "algorithm" traces one path (shown in the signal color).
 * Hovering or focusing a branch traces that branch instead.
 * Pure SVG — no chart library — so it is light and crisp at any size.
 */
import { useEffect, useMemo, useState } from 'react'
import { useMediaQuery, usePrefersReducedMotion } from '../utils/useMediaQuery'

const BRANCHES = [
  { label: 'Money', leaves: ['₹1,000 now', '₹1,500 later'] },
  { label: 'Time', leaves: ['Express', 'Wait 4 days'] },
  { label: 'Risk', leaves: ['Certain', 'The gamble'] },
  { label: 'Trust', leaves: ['4.8★ · 120', '4.5★ · 4,800'] },
  { label: 'Convenience', leaves: ['5 min away', '₹200 cheaper'] },
  { label: 'Social Influence', leaves: ['9,000 bought', 'No signal'] },
]

/** Smooth horizontal S-curve between two points. */
const curve = (x1: number, y1: number, x2: number, y2: number) => {
  const mx = (x1 + x2) / 2
  return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`
}

export default function DecisionTree() {
  const compact = !useMediaQuery('(min-width: 768px)')
  const reducedMotion = usePrefersReducedMotion()

  // Layout numbers for the two sizes.
  const L = compact
    ? { w: 400, h: 470, rootX: 34, branchX: 170, leafX: 300, top: 40, font: 12, leafFont: 11 }
    : { w: 760, h: 540, rootX: 60, branchX: 340, leafX: 590, top: 42, font: 15, leafFont: 14 }

  const geometry = useMemo(() => {
    const rootY = L.h / 2
    const usable = L.h - L.top * 2
    const branchGap = usable / (BRANCHES.length - 1)
    const leafGap = usable / (BRANCHES.length * 2 - 1)
    return BRANCHES.map((b, i) => {
      const by = L.top + i * branchGap
      return {
        ...b,
        x: L.branchX,
        y: by,
        path: curve(L.rootX, rootY, L.branchX, by),
        leaves: b.leaves.map((label, j) => {
          const ly = L.top + (i * 2 + j) * leafGap
          return { label, x: L.leafX, y: ly, path: curve(L.branchX, by, L.leafX, ly) }
        }),
      }
    })
  }, [L.h, L.top, L.rootX, L.branchX, L.leafX])

  // The path the "algorithm" is currently tracing: [branchIndex, leafIndex].
  const [auto, setAuto] = useState<[number, number]>([2, 1])
  const [hovered, setHovered] = useState<number | null>(null)

  useEffect(() => {
    if (reducedMotion) return
    let step = 0
    const id = window.setInterval(() => {
      step++
      // Deterministic but varied sequence through the branches.
      setAuto([(step * 5 + 2) % BRANCHES.length, step % 2])
    }, 2600)
    return () => window.clearInterval(id)
  }, [reducedMotion])

  const activeBranch = hovered ?? auto[0]
  const activeLeaf = hovered === null ? auto[1] : -1 // hover lights both leaves
  const rootY = L.h / 2

  return (
    <figure className="relative" aria-labelledby="tree-caption">
      <svg viewBox={`0 0 ${L.w} ${L.h}`} className="h-auto w-full overflow-visible" role="img" aria-label="Diagram: a single decision branching into money, time, risk, trust, convenience and social influence, each with two possible outcomes.">
        {/* Edges */}
        {geometry.map((b, i) => {
          const on = i === activeBranch
          return (
            <g key={b.label}>
              <path d={b.path} fill="none" stroke={on ? 'var(--color-signal)' : 'var(--color-line-strong)'} strokeWidth={on ? 1.6 : 1} style={{ transition: 'stroke 0.6s' }} />
              {b.leaves.map((leaf, j) => {
                const leafOn = on && (activeLeaf === -1 || activeLeaf === j)
                return (
                  <path key={leaf.label} d={leaf.path} fill="none" stroke={leafOn ? 'var(--color-signal)' : 'var(--color-line)'} strokeWidth={leafOn ? 1.4 : 1} strokeDasharray={leafOn ? undefined : '2 4'} style={{ transition: 'stroke 0.6s' }} />
                )
              })}
              {/* A small pulse travelling along the active path */}
              {on && !reducedMotion && (
                <circle r="3" fill="var(--color-signal)">
                  <animateMotion dur="1.6s" repeatCount="indefinite" path={b.path} />
                </circle>
              )}
            </g>
          )
        })}

        {/* Root node */}
        <g>
          <circle cx={L.rootX} cy={rootY} r="16" fill="none" stroke="var(--color-line-strong)" />
          <circle cx={L.rootX} cy={rootY} r="5" fill="var(--color-signal)" />
          <text x={L.rootX} y={rootY + 36} textAnchor="middle" fill="var(--color-ink)" fontFamily="var(--font-mono)" fontSize={L.font - 1} letterSpacing="0.14em">
            DECISION
          </text>
        </g>

        {/* Branch + leaf nodes */}
        {geometry.map((b, i) => {
          const on = i === activeBranch
          return (
            <g
              key={b.label}
              tabIndex={0}
              role="group"
              aria-label={`${b.label}: ${b.leaves.map((l) => l.label).join(' or ')}`}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(i)}
              onBlur={() => setHovered(null)}
              className="cursor-default outline-none"
            >
              {/* generous invisible hit area */}
              <rect x={b.x - 30} y={b.y - 24} width={L.leafX - b.x + 120} height={48} fill="transparent" />
              <circle cx={b.x} cy={b.y} r={on ? 5 : 3.5} fill={on ? 'var(--color-signal)' : 'var(--color-ink)'} style={{ transition: 'r 0.4s, fill 0.4s' }} />
              <text x={b.x} y={b.y - 12} textAnchor="middle" fill={on ? 'var(--color-ink)' : 'var(--color-ink-2)'} fontFamily="var(--font-mono)" fontSize={L.font - 1} letterSpacing="0.08em" style={{ transition: 'fill 0.4s' }}>
                {b.label.toUpperCase()}
              </text>
              {b.leaves.map((leaf, j) => {
                const leafOn = on && (activeLeaf === -1 || activeLeaf === j)
                return (
                  <g key={leaf.label} className={reducedMotion ? '' : 'tree-drift'} style={{ animationDelay: `${(i * 2 + j) * -0.7}s` }}>
                    <circle cx={leaf.x} cy={leaf.y} r={leafOn ? 4 : 2.5} fill={leafOn ? 'var(--color-signal)' : 'var(--color-muted)'} style={{ transition: 'r 0.4s, fill 0.4s' }} />
                    <text x={leaf.x + 12} y={leaf.y + 4} fill={leafOn ? 'var(--color-ink)' : 'var(--color-muted)'} fontFamily="var(--font-sans)" fontSize={L.leafFont} style={{ transition: 'fill 0.4s' }}>
                      {leaf.label}
                    </text>
                  </g>
                )
              })}
            </g>
          )
        })}
      </svg>
      <figcaption id="tree-caption" className="eyebrow mt-4 flex items-center gap-2">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-signal" aria-hidden="true" />
        Every choice is a path. Some paths are taken more often than others.
      </figcaption>
    </figure>
  )
}
