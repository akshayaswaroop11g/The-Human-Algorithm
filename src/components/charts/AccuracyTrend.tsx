import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { COLORS, TOOLTIP_STYLE } from '../../config/theme'

const axisTick = { fill: COLORS.muted, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }

/**
 * Running accuracy after each scored round, next to what random guessing
 * would expect over the same rounds (dashed).
 */
export default function AccuracyTrend({ data }: { data: { round: number; accuracy: number; random: number }[] }) {
  const last = data.at(-1)
  return (
    <div
      className="h-60 w-full"
      role="img"
      aria-label={`Line chart of running prediction accuracy over ${data.length} rounds, ending at ${last?.accuracy ?? 0}%, compared with ${last?.random ?? 0}% expected from random guessing.`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: -18 }}>
          <CartesianGrid stroke={COLORS.line} vertical={false} />
          <XAxis dataKey="round" tick={axisTick} tickLine={false} axisLine={{ stroke: COLORS.line }} />
          <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={axisTick} tickLine={false} axisLine={false} unit="%" />
          <Tooltip {...TOOLTIP_STYLE} labelFormatter={(l) => `After round ${l}`} formatter={(v, name) => [`${v}%`, name]} />
          <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: COLORS.ink2 }} iconType="plainline" />
          <Line name="Algorithm" type="monotone" dataKey="accuracy" stroke={COLORS.signal} strokeWidth={2} dot={false} activeDot={{ r: 5 }} animationDuration={900} />
          <Line name="Random guessing" type="monotone" dataKey="random" stroke={COLORS.muted} strokeWidth={2} strokeDasharray="4 4" dot={false} animationDuration={900} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
