import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { COLORS, TOOLTIP_STYLE } from '../../config/theme'

const axisTick = { fill: COLORS.muted, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }

/** Simple single-series bar chart, e.g. seconds per decision or per category. */
export default function TimeBars({
  data,
  xKey,
  height = 200,
  ariaLabel,
  horizontal = false,
}: {
  data: { label: string; seconds: number }[]
  xKey?: string
  height?: number
  ariaLabel: string
  horizontal?: boolean
}) {
  return (
    <div className="w-full" style={{ height }} role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        {horizontal ? (
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }} barCategoryGap={6}>
            <CartesianGrid stroke={COLORS.line} horizontal={false} />
            <XAxis type="number" tick={axisTick} tickLine={false} axisLine={false} unit="s" />
            <YAxis type="category" dataKey="label" tick={{ ...axisTick, fill: COLORS.ink2 }} tickLine={false} axisLine={false} width={130} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${v}s`, 'Median time']} />
            <Bar dataKey="seconds" fill={COLORS.ink2} radius={[0, 4, 4, 0]} maxBarSize={18} animationDuration={800} />
          </BarChart>
        ) : (
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -22 }} barCategoryGap={2}>
            <CartesianGrid stroke={COLORS.line} vertical={false} />
            <XAxis dataKey={xKey ?? 'label'} tick={axisTick} tickLine={false} axisLine={{ stroke: COLORS.line }} interval="preserveStartEnd" />
            <YAxis tick={axisTick} tickLine={false} axisLine={false} unit="s" />
            <Tooltip {...TOOLTIP_STYLE} labelFormatter={(l) => `Decision ${l}`} formatter={(v) => [`${v}s`, 'Time to decide']} />
            <Bar dataKey="seconds" fill={COLORS.ink2} radius={[4, 4, 0, 0]} animationDuration={800} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
