import { useState } from 'react'
import { Amount } from '@/components/ui/Amount'
import { Button } from '@/components/ui/Button'
import { BottomSheet } from '@/components/ui/Dialog'
import { List, ListItem } from '@/components/ui/List'
import type { BalanceSummary } from '@/features/finance/derive'
import type { AccountKind } from '@/features/finance/model'

const KIND_LABEL: Record<AccountKind, string> = {
  checking: 'Conta corrente',
  savings: 'Poupança',
  cash: 'Dinheiro',
  credit_card: 'Cartão de crédito',
  savings_box: 'Caixinha',
  investment: 'Investimento',
}

export function BalanceCard({ summary }: { summary: BalanceSummary }) {
  const [open, setOpen] = useState(false)

  return (
    <section
      aria-labelledby="balance-title"
      className="flex flex-col rounded-lg border border-border bg-surface-1 p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id="balance-title" className="text-sm font-medium text-fg-muted">
          Saldo em contas
        </h2>
        <Button variant="ghost" className="-my-2 -mr-2" onClick={() => setOpen(true)}>
          Por conta
        </Button>
      </div>
      <p className="mt-1 mb-5">
        <Amount value={summary.inAccounts} size="display" />
      </p>
      <dl className="mt-auto grid grid-cols-2 gap-4 border-t border-border pt-4">
        {summary.hasCreditCard && (
          <div>
            <dt className="text-xs text-fg-muted">Fatura em aberto</dt>
            <dd className="mt-0.5">
              <Amount value={summary.openCardBills} />
            </dd>
          </div>
        )}
        <div>
          <dt className="text-xs text-fg-muted">Patrimônio</dt>
          <dd className="mt-0.5">
            <Amount value={summary.netWorth} />
          </dd>
        </div>
      </dl>

      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        title="Saldo por conta"
        description="Saldo em contas soma conta corrente, poupança e dinheiro. Caixinhas, investimentos e cartão entram no patrimônio."
      >
        <List>
          {summary.byAccount.map(({ account, balance }) => (
            <ListItem
              key={account.id}
              title={account.name}
              subtitle={KIND_LABEL[account.kind]}
              trailing={<Amount value={balance} size="sm" />}
            />
          ))}
        </List>
      </BottomSheet>
    </section>
  )
}
