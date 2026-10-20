// @vitest-environment node
import { cents } from '@/lib/money'
import { localDate } from '@/lib/dates'
import {
  balanceSummary,
  changePercent,
  cycleComparison,
  incomeAllocation,
  pendingReviewCount,
  recentTransactions,
  sliceDetail,
  upcomingCharges,
} from './derive'
import type { Account, FinanceSnapshot, Recurrence, Transaction } from './model'

// Hand-checked fixture. "Today" is 2026-10-19; amounts in centavos.
const accounts: Account[] = [
  { id: 'nubank', name: 'Conta', kind: 'checking', openingBalance: cents(100000) },
  { id: 'wallet', name: 'Carteira', kind: 'cash', openingBalance: cents(5000) },
  { id: 'card', name: 'Cartão', kind: 'credit_card', openingBalance: cents(0) },
  { id: 'box', name: 'Reserva', kind: 'savings_box', openingBalance: cents(0) },
]

const tx = (
  t: Omit<Transaction, 'reviewStatus' | 'category' | 'description' | 'occurredOn' | 'amount'> & {
    amount: number
    on: string
    reviewStatus?: Transaction['reviewStatus']
  },
): Transaction => ({
  category: 'Outros',
  description: t.id,
  reviewStatus: 'ok',
  ...t,
  amount: cents(t.amount),
  occurredOn: localDate(t.on),
})

const transactions: Transaction[] = [
  // September (previous cycle)
  tx({ id: 'p1', kind: 'income', amount: 500000, on: '2026-09-05', accountId: 'nubank' }),
  tx({
    id: 'p2',
    kind: 'expense',
    amount: 40000,
    on: '2026-09-12',
    accountId: 'nubank',
    nature: 'variable',
  }),
  tx({
    id: 'p3',
    kind: 'expense',
    amount: 9999,
    on: '2026-09-25',
    accountId: 'nubank',
    nature: 'variable',
  }),
  // October (current cycle)
  tx({
    id: 't1',
    kind: 'income',
    amount: 500000,
    on: '2026-10-05',
    accountId: 'nubank',
    recurrenceId: 'salary',
  }),
  tx({
    id: 't2',
    kind: 'expense',
    amount: 150000,
    on: '2026-10-06',
    accountId: 'nubank',
    nature: 'fixed',
    recurrenceId: 'rent',
  }),
  tx({
    id: 't3',
    kind: 'expense',
    amount: 30000,
    on: '2026-10-10',
    accountId: 'card',
    nature: 'variable',
  }),
  tx({
    id: 't4',
    kind: 'transfer',
    amount: 50000,
    on: '2026-10-11',
    accountId: 'nubank',
    counterAccountId: 'box',
  }),
  tx({
    id: 't5',
    kind: 'transfer',
    amount: 20000,
    on: '2026-10-15',
    accountId: 'nubank',
    counterAccountId: 'card',
  }),
  tx({
    id: 't6',
    kind: 'expense',
    amount: 2000,
    on: '2026-10-18',
    accountId: 'wallet',
    nature: 'variable',
    reviewStatus: 'pending',
  }),
]

const rec = (
  r: Omit<Recurrence, 'expectedAmount' | 'category'> & { amount: number },
): Recurrence => ({
  category: 'Outros',
  ...r,
  expectedAmount: cents(r.amount),
})

const recurrences: Recurrence[] = [
  rec({
    id: 'salary',
    name: 'Salário',
    kind: 'income',
    amount: 500000,
    dayOfMonth: 5,
    isSubscription: false,
  }),
  rec({
    id: 'rent',
    name: 'Aluguel',
    kind: 'expense',
    amount: 150000,
    dayOfMonth: 6,
    isSubscription: false,
  }),
  rec({
    id: 'internet',
    name: 'Internet',
    kind: 'expense',
    amount: 10000,
    dayOfMonth: 25,
    isSubscription: false,
  }),
  rec({
    id: 'stream',
    name: 'Streaming',
    kind: 'expense',
    amount: 3990,
    dayOfMonth: 3,
    isSubscription: true,
  }),
]

const snapshot: FinanceSnapshot = {
  userFirstName: 'Ana',
  accounts,
  transactions,
  recurrences,
  savingsBoxes: [],
  portfolio: null,
}

const today = localDate('2026-10-19')

describe('balanceSummary', () => {
  const summary = balanceSummary(snapshot)

  it('derives each balance from opening balance and movements', () => {
    const byId = Object.fromEntries(summary.byAccount.map((row) => [row.account.id, row.balance]))
    // 100000 + 500000 − 40000 − 9999 + 500000 − 150000 − 50000 − 20000
    expect(byId.nubank).toBe(830001)
    expect(byId.wallet).toBe(3000)
    expect(byId.card).toBe(-10000) // −30000 spent + 20000 paid
    expect(byId.box).toBe(50000)
  })

  it('counts only checking, savings and cash as balance in accounts (bug C-03)', () => {
    expect(summary.inAccounts).toBe(833001)
    expect(summary.openCardBills).toBe(10000)
    expect(summary.hasCreditCard).toBe(true)
  })

  it('computes net worth as accounts + boxes + investments − open bills', () => {
    expect(summary.netWorth).toBe(833001 + 50000 - 10000)
  })
})

describe('cycleComparison', () => {
  const cycle = cycleComparison(snapshot, today)

  it('totals the current cycle; transfers are never expenses', () => {
    expect(cycle.current).toEqual({ income: 500000, expenses: 182000, saved: 50000 })
  })

  it('compares with day 1 to the same day of the previous cycle', () => {
    // p3 on Sep 25 is after Sep 19 and must be left out.
    expect(cycle.previous).toEqual({ income: 500000, expenses: 40000, saved: 0 })
    expect([cycle.previousFrom, cycle.previousTo]).toEqual(['2026-09-01', '2026-09-19'])
  })

  it('computes percent change, or null without a base', () => {
    expect(changePercent(cents(182000), cents(40000))).toBe(355)
    expect(changePercent(cents(50000), cents(0))).toBeNull()
  })
})

describe('incomeAllocation', () => {
  it('splits the income into four slices; unpaid commitments reduce what is available', () => {
    expect(incomeAllocation(snapshot, today)).toEqual({
      status: 'ok',
      income: 500000,
      incomeForecast: 0,
      fixedPaid: 150000,
      fixedPlanned: 13990, // internet (due 25) + streaming (due 3, still unpaid)
      variable: 32000,
      saved: 50000,
      available: 254010, // 500000 − 150000 − 13990 − 32000 − 50000
    })
  })

  it('reports the excess instead of a donut when spending passes income', () => {
    const extra = tx({
      id: 'x',
      kind: 'expense',
      amount: 300000,
      on: '2026-10-19',
      accountId: 'nubank',
      nature: 'variable',
    })
    expect(
      incomeAllocation({ ...snapshot, transactions: [...transactions, extra] }, today),
    ).toEqual({
      status: 'overflow',
      income: 500000,
      used: 545990,
      excess: 45990,
    })
  })

  it('counts recurring income due later in the cycle as forecast', () => {
    const early = localDate('2026-10-03')
    const result = incomeAllocation({ ...snapshot, transactions: [] }, early)
    expect(result).toMatchObject({ status: 'ok', income: 500000, incomeForecast: 500000 })
  })

  it('does not count on late income that has not arrived', () => {
    const withoutSalary = transactions.filter((t) => t.id !== 't1')
    expect(incomeAllocation({ ...snapshot, transactions: withoutSalary }, today)).toEqual({
      status: 'no-income',
    })
  })
})

describe('upcomingCharges', () => {
  it('lists unpaid expenses due in the next 15 days, nearest first', () => {
    const charges = upcomingCharges(snapshot, today)
    expect(charges.map((c) => [c.recurrence.id, c.dueOn, c.daysUntil])).toEqual([
      ['internet', '2026-10-25', 6],
      ['stream', '2026-11-03', 15],
    ])
  })
})

describe('lists', () => {
  it('counts pending reviews in the current cycle', () => {
    expect(pendingReviewCount(transactions, today)).toBe(1)
  })

  it('returns the latest transactions first', () => {
    expect(recentTransactions(transactions, 3).map((t) => t.id)).toEqual(['t6', 't5', 't4'])
  })
})

describe('sliceDetail', () => {
  it('lists exactly what each slice sums to', () => {
    const fixed = sliceDetail(snapshot, today, 'fixed')
    expect(fixed.transactions.map((t) => t.id)).toEqual(['t2'])
    expect(fixed.planned.map((r) => r.id)).toEqual(['internet', 'stream'])
    expect(sliceDetail(snapshot, today, 'variable').transactions.map((t) => t.id)).toEqual([
      't6',
      't3',
    ])
    // The card bill payment (t5) is a transfer but not savings.
    expect(sliceDetail(snapshot, today, 'saved').transactions.map((t) => t.id)).toEqual(['t4'])
  })
})
