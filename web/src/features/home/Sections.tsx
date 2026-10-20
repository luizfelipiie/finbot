import { ClipboardCheck, Repeat } from 'lucide-react'
import { Link } from 'react-router'
import { Amount } from '@/components/ui/Amount'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { List } from '@/components/ui/List'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { EmptyState } from '@/components/ui/States'
import type { BalanceSummary, UpcomingCharge } from '@/features/finance/derive'
import type { FinanceSnapshot, Portfolio, Transaction } from '@/features/finance/model'
import { formatDayMonth, formatDaysUntil, monthName, type LocalDate } from '@/lib/dates'
import { cents, formatMoney, formatPercent, percentOf, returnPercent } from '@/lib/money'
import { cn } from '@/lib/cn'
import { TransactionRow } from './TransactionRow'

const linkButton =
  'inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-fg-muted transition-colors duration-150 ease-out hover:bg-surface-2 hover:text-fg'

export function UpcomingCharges({ charges }: { charges: UpcomingCharge[] }) {
  return (
    <Card title="Próximas cobranças" subtitle="Nos próximos 15 dias">
      {charges.length === 0 ? (
        <EmptyState title="Nenhuma cobrança nos próximos 15 dias." />
      ) : (
        <ul
          aria-label="Cobranças"
          // Focusable so keyboard users can scroll the cards on mobile.
          tabIndex={0}
          className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:-mx-5 sm:px-5 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0 lg:pb-0"
        >
          {charges.map(({ recurrence, dueOn, daysUntil }) => (
            <li
              key={`${recurrence.id}-${dueOn}`}
              className={cn(
                'flex w-40 shrink-0 snap-start flex-col gap-2 rounded-md border border-border bg-surface-2 p-3',
                'lg:w-auto lg:flex-row lg:items-center lg:gap-3 lg:rounded-none lg:border-0 lg:border-b lg:bg-transparent lg:px-0 lg:py-3 lg:last:border-b-0',
              )}
            >
              <span className="flex min-w-0 items-start justify-between gap-2 lg:flex-1 lg:flex-col lg:gap-0.5">
                <span className="flex items-center gap-1.5 text-sm font-medium text-fg">
                  {recurrence.name}
                  {recurrence.isSubscription && (
                    <Repeat
                      aria-label="Assinatura"
                      size={16}
                      strokeWidth={1.5}
                      className="shrink-0 text-fg-subtle"
                    />
                  )}
                </span>
                <span className="hidden text-xs text-fg-muted lg:block">
                  {formatDayMonth(dueOn)}, {formatDaysUntil(daysUntil)}
                </span>
              </span>
              <Amount
                value={recurrence.expectedAmount}
                size="md"
                className="font-medium lg:text-sm"
              />
              <span className="text-xs text-fg-muted lg:hidden">
                {formatDayMonth(dueOn)}, {formatDaysUntil(daysUntil)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export function PendingReview({ count, today }: { count: number; today: LocalDate }) {
  if (count === 0) return null
  return (
    <section
      aria-label="Pendências de revisão"
      className="flex items-center gap-3 rounded-lg border border-border bg-surface-1 p-4 sm:p-5"
    >
      <ClipboardCheck aria-hidden size={24} strokeWidth={1.5} className="shrink-0 text-warning" />
      <p className="min-w-0 flex-1 text-sm text-fg">
        {count === 1 ? '1 lançamento' : `${count} lançamentos`} para conferir em {monthName(today)}
      </p>
      <Link to="/transacoes" className={linkButton}>
        Revisar
      </Link>
    </section>
  )
}

export function SavingsBoxes({
  snapshot,
  summary,
}: {
  snapshot: FinanceSnapshot
  summary: BalanceSummary
}) {
  const rows = snapshot.savingsBoxes
    .map((box) => {
      const row = summary.byAccount.find((r) => r.account.id === box.accountId)
      return row ? { box, account: row.account, balance: row.balance } : null
    })
    .filter((row) => row !== null)
    .sort((a, b) => b.box.target - a.box.target)
    .slice(0, 3)

  return (
    <Card
      title="Caixinhas"
      action={
        <Link to="/planejar" className={linkButton}>
          Ver todas
        </Link>
      }
    >
      {rows.length === 0 ? (
        <EmptyState
          title="Nenhuma caixinha criada."
          description="Separe dinheiro para um objetivo sem misturar com o saldo do dia a dia."
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {rows.map(({ box, account, balance }) => {
            const percent = percentOf(balance, box.target)
            return (
              <li key={box.accountId} className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm font-medium text-fg">{account.name}</span>
                  <span className="shrink-0 text-xs text-fg-muted tabular">
                    {formatPercent(percent)}
                  </span>
                </div>
                <ProgressBar
                  label={`Progresso de ${account.name}`}
                  percent={percent}
                  valueText={`${formatMoney(balance)} de ${formatMoney(box.target)}`}
                />
                <p className="text-xs text-fg-muted">
                  <Amount value={balance} size="sm" className="text-xs text-fg" /> de{' '}
                  <Amount value={box.target} size="sm" className="text-xs" />
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

export function PortfolioCard({ portfolio }: { portfolio: Portfolio }) {
  const result = cents(portfolio.marketValue - portfolio.invested)
  const pct = returnPercent(portfolio.marketValue, portfolio.invested)
  return (
    <Card
      title="Carteira"
      subtitle="Valores de demonstração"
      action={
        <Link to="/carteira" className={linkButton}>
          Abrir
        </Link>
      }
    >
      <dl className="grid grid-cols-2 gap-4">
        <div>
          <dt className="text-xs text-fg-muted">Aplicado</dt>
          <dd className="mt-0.5">
            <Amount value={portfolio.invested} />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-fg-muted">Valor atual</dt>
          <dd className="mt-0.5">
            <Amount value={portfolio.marketValue} />
          </dd>
        </div>
        <div className="col-span-2 flex items-center justify-between border-t border-border pt-4">
          <dt className="text-sm text-fg">Resultado</dt>
          <dd className="flex items-center gap-2">
            <Amount value={result} tone="signed" />
            {pct !== null && (
              <Badge tone={result >= 0 ? 'positive' : 'negative'}>
                {formatPercent(pct, { fractionDigits: 1, sign: 'always' })}
              </Badge>
            )}
          </dd>
        </div>
      </dl>
    </Card>
  )
}

export function RecentTransactions({
  transactions,
  today,
}: {
  transactions: Transaction[]
  today: LocalDate
}) {
  return (
    <Card
      title="Últimas transações"
      action={
        <Link to="/transacoes" className={linkButton}>
          Ver todas
        </Link>
      }
    >
      {transactions.length === 0 ? (
        <EmptyState
          title="Nenhuma transação ainda."
          description="Registre a primeira pelo botão + ou pelo WhatsApp."
        />
      ) : (
        <List label="Últimas transações">
          {transactions.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} today={today} />
          ))}
        </List>
      )}
    </Card>
  )
}
