interface Props {
  value: number
  label?: string
  tone?: 'amber' | 'emerald'
}

const toneClassNames = {
  amber: 'bg-amber-400',
  emerald: 'bg-emerald-400',
}

export default function ProgressBar({
  value,
  label,
  tone = 'amber',
}: Props) {
  const safeValue = Math.max(0, Math.min(100, value))

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
        <span>{label ?? 'Progress'}</span>
        <span>{Math.round(safeValue)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800/70">
        <div
          className={`h-full rounded-full transition-all duration-500 ${toneClassNames[tone]}`}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  )
}
