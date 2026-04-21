const VERDICTS = {
  correct: {
    label: '좋은 선택',
    icon: '✓',
    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  warning: {
    label: '개선 가능',
    icon: '△',
    className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  mistake: {
    label: '실수',
    icon: '✗',
    className: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  },
}

export default function VerdictBadge({ verdict = 'warning' }) {
  const { label, icon, className } = VERDICTS[verdict] || VERDICTS.warning
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${className}`}>
      {icon} {label}
    </span>
  )
}
