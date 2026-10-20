import { usePrivacy } from '@/app/privacy'
import { cn } from '@/lib/cn'
import { formatMoney, formatMoneyCompact, moneyParts, type Cents } from '@/lib/money'

type AmountSize = 'sm' | 'md' | 'lg' | 'display'
/** `signed` colors and signs income/expense; color never carries meaning alone. */
type AmountTone = 'plain' | 'signed' | 'muted'

interface AmountProps {
  value: Cents
  size?: AmountSize
  tone?: AmountTone
  /** "R$ 4,2 mil" instead of the full value. */
  compact?: boolean
  className?: string
}

const sizeClass: Record<Exclude<AmountSize, 'display'>, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl font-semibold',
}

const HIDDEN = 'R$ ••••'

/** The only way the app renders money. Respects privacy mode. */
export function Amount({
  value,
  size = 'md',
  tone = 'plain',
  compact = false,
  className,
}: AmountProps) {
  const { hidden } = usePrivacy()
  const signMode = tone === 'signed' ? 'always' : 'auto'
  const color = cn(
    tone === 'muted' && 'text-fg-muted',
    tone === 'signed' && value > 0 && 'text-positive',
    tone === 'signed' && value < 0 && 'text-fg',
  )

  if (hidden) {
    return (
      <span className={cn('tabular', size !== 'display' && sizeClass[size], color, className)}>
        <span aria-hidden>{HIDDEN}</span>
        <span className="sr-only">Valor oculto</span>
      </span>
    )
  }

  if (size === 'display') {
    const parts = moneyParts(value, { sign: signMode })
    return (
      <span className={cn('inline-flex items-baseline tabular text-fg', className)}>
        <span className="sr-only">{formatMoney(value)}</span>
        <span aria-hidden className="mr-1.5 text-lg font-medium text-fg-muted">
          {parts.sign && `${parts.sign} `}
          {parts.currency}
        </span>
        <span aria-hidden className="text-3xl font-semibold tracking-tight">
          {parts.integer}
        </span>
        <span aria-hidden className="text-lg font-medium text-fg-muted">
          {parts.decimal}
          {parts.fraction}
        </span>
      </span>
    )
  }

  const text = compact
    ? formatMoneyCompact(value, { sign: signMode })
    : formatMoney(value, { sign: signMode })
  return (
    <span className={cn('tabular whitespace-nowrap', sizeClass[size], color, className)}>
      {text}
    </span>
  )
}
