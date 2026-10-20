import { cn } from '@/lib/cn'

interface ProgressBarProps {
  /** Accessible name, e.g. "Progresso da Reserva de emergência". */
  label: string
  /** 0–100; values above 100 are shown full. */
  percent: number
  /** Text for screen readers, e.g. "R$ 6.000 de R$ 10.000". */
  valueText?: string
  highlight?: boolean
}

export function ProgressBar({ label, percent, valueText, highlight = false }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent))
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      aria-valuetext={valueText}
      className="h-2 w-full overflow-hidden rounded-sm bg-surface-3"
    >
      <div
        className={cn('h-full rounded-sm', highlight ? 'bg-accent' : 'bg-chart-1')}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
