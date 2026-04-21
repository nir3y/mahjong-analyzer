export default function StatCard({ label, value, unit, trend, trendUp, accentColor = 'indigo' }) {
  const borderColor = {
    indigo: 'border-indigo-500/20',
    emerald: 'border-emerald-500/20',
    rose: 'border-rose-500/20',
    amber: 'border-amber-500/20',
  }[accentColor]

  const glowColor = {
    indigo: 'bg-indigo-500/5',
    emerald: 'bg-emerald-500/5',
    rose: 'bg-rose-500/5',
    amber: 'bg-amber-500/5',
  }[accentColor]

  return (
    <div className={`relative overflow-hidden rounded-xl border ${borderColor} bg-slate-800/60 backdrop-blur-sm p-5`}>
      <div className={`absolute top-0 right-0 h-24 w-24 rounded-full ${glowColor} blur-2xl`} />
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="mt-2 text-4xl font-bold tabular-nums text-slate-100">
        {value}
        {unit && <span className="text-lg text-slate-400 ml-1">{unit}</span>}
      </p>
      {trend && (
        <p className={`mt-1 text-sm ${trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
          {trendUp ? '↑' : '↓'} {trend}
        </p>
      )}
    </div>
  )
}
