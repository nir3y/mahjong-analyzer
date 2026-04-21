const VARIANTS = {
  warning: {
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    icon: '⚠',
    iconColor: 'text-amber-400',
    titleColor: 'text-amber-300',
  },
  success: {
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    icon: '✓',
    iconColor: 'text-emerald-400',
    titleColor: 'text-emerald-300',
  },
  info: {
    border: 'border-indigo-500/30',
    bg: 'bg-indigo-500/10',
    icon: 'ℹ',
    iconColor: 'text-indigo-400',
    titleColor: 'text-indigo-300',
  },
}

export default function InsightCallout({ variant = 'info', title, detail }) {
  const v = VARIANTS[variant]
  return (
    <div className={`rounded-xl border ${v.border} ${v.bg} p-4 flex gap-3`}>
      <span className={`shrink-0 mt-0.5 text-base ${v.iconColor}`}>{v.icon}</span>
      <div>
        <p className={`text-sm font-medium ${v.titleColor}`}>{title}</p>
        {detail && <p className="mt-1 text-sm text-slate-400">{detail}</p>}
      </div>
    </div>
  )
}
