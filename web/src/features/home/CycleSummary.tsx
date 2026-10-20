import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { Amount } from '@/components/ui/Amount'
import { Card } from '@/components/ui/Card'
import { changePercent, type CycleComparison } from '@/features/finance/derive'
import { dayOfMonth, monthName, type LocalDate } from '@/lib/dates'
import { formatPercent, type Cents } from '@/lib/money'

function Change({ current, previous }: { current: Cents; previous: Cents }) {
  const change = changePercent(current, previous)
  if (change === null) return <span className="text-xs text-fg-muted">Sem base para comparar</span>
  const Icon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus
  const text =
    change === 0
      ? 'Igual ao ciclo anterior'
      : `${formatPercent(Math.abs(change))} ${change > 0 ? 'a mais' : 'a menos'}`
  // Neutral color on purpose: more income is good, more spending is not; the words carry it.
  return (
    <span className="inline-flex items-center gap-1 text-xs text-fg-muted">
      <Icon aria-hidden size={16} strokeWidth={1.5} />
      {text}
    </span>
  )
}

/** "1 a 19 de outubro" (or "1 de outubro" on the first day). */
function span(until: LocalDate): string {
  const day = dayOfMonth(until)
  return `${day === 1 ? '1' : `1 a ${day}`} de ${monthName(until)}`
}

export function CycleSummary({ cycle }: { cycle: CycleComparison }) {
  const rows = [
    { label: 'Receitas', current: cycle.current.income, previous: cycle.previous.income },
    { label: 'Despesas', current: cycle.current.expenses, previous: cycle.previous.expenses },
    { label: 'Guardado', current: cycle.current.saved, previous: cycle.previous.saved },
  ]

  return (
    <Card
      title={`Resumo de ${monthName(cycle.to)}`}
      subtitle={`${span(cycle.to)}, comparado com ${span(cycle.previousTo)}`}
    >
      <dl className="flex flex-col">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-3 border-b border-border py-3 first:pt-0 last:border-b-0 last:pb-0"
          >
            <dt className="text-sm text-fg">{row.label}</dt>
            <dd className="flex flex-col items-end gap-0.5">
              <Amount value={row.current} />
              <Change current={row.current} previous={row.previous} />
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}
