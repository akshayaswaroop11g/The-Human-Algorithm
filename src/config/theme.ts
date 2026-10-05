/**
 * Colors for charts (Recharts needs real color values, not CSS classes).
 * Keep these in sync with the tokens at the top of src/index.css.
 */
export const COLORS = {
  bg: '#0b0b0c',
  surface: '#111113',
  raised: '#18181b',
  line: '#26262a',
  lineStrong: '#3a3a40',
  ink: '#edede9',
  ink2: '#b8b8b2',
  muted: '#8c8c86',
  signal: '#ff6a3d',
  optA: '#de5a30',
  optB: '#4f86e8',
}

/** Shared tooltip look for every chart. */
export const TOOLTIP_STYLE = {
  contentStyle: {
    background: COLORS.raised,
    border: `1px solid ${COLORS.lineStrong}`,
    borderRadius: 0,
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 12,
    color: COLORS.ink,
  },
  labelStyle: { color: COLORS.muted, marginBottom: 4 },
  itemStyle: { color: COLORS.ink },
  cursor: { stroke: COLORS.lineStrong, fill: 'rgba(255,255,255,0.03)' },
}
