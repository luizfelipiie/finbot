import { Amount } from '@/components/ui/Amount'
import { Badge } from '@/components/ui/Badge'
import { ListItem } from '@/components/ui/List'
import type { Transaction } from '@/features/finance/model'
import { formatRelativeDate, type LocalDate } from '@/lib/dates'
import { cents } from '@/lib/money'
import { CategoryIcon } from './CategoryIcon'

/** Expense shows "−", income "+"; transfers have no sign because they do not change the total. */
export function TransactionRow({ tx, today }: { tx: Transaction; today: LocalDate }) {
  const signed = tx.kind === 'expense' ? cents(-tx.amount) : tx.amount
  return (
    <ListItem
      leading={<CategoryIcon category={tx.category} />}
      title={tx.description}
      subtitle={
        <span className="inline-flex items-center gap-2">
          {tx.kind === 'transfer' ? 'Transferência' : tx.category}
          {tx.reviewStatus === 'pending' && <Badge tone="warning">Conferir</Badge>}
        </span>
      }
      trailing={
        <Amount value={signed} size="sm" tone={tx.kind === 'transfer' ? 'muted' : 'signed'} />
      }
      trailingSubtitle={formatRelativeDate(tx.occurredOn, today)}
    />
  )
}
