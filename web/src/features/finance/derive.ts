import { cents, sumCents, type Cents } from '@/lib/money'
import {
  addDays,
  dayOfMonth,
  daysBetween,
  endOfMonth,
  sameDayPreviousMonth,
  startOfMonth,
  type LocalDate,
} from '@/lib/dates'
import type { Account, AccountKind, FinanceSnapshot, Recurrence, Transaction } from './model'

const LIQUID: readonly AccountKind[] = ['checking', 'savings', 'cash']
const SAVING_DESTINATIONS: readonly AccountKind[] = ['savings_box', 'investment']

const inRange = (date: LocalDate, from: LocalDate, to: LocalDate) => date >= from && date <= to

/** Balance is always derived: opening balance plus every movement touching the account. */
export function accountBalance(account: Account, transactions: readonly Transaction[]): Cents {
  let balance: number = account.openingBalance
  for (const tx of transactions) {
    if (tx.accountId === account.id) {
      balance += tx.kind === 'income' ? tx.amount : -tx.amount
    } else if (tx.kind === 'transfer' && tx.counterAccountId === account.id) {
      balance += tx.amount
    }
  }
  return cents(balance)
}

export interface BalanceSummary {
  /** Checking, savings and cash only. */
  inAccounts: Cents
  /** Sum of credit card debt (positive number), or 0. */
  openCardBills: Cents
  hasCreditCard: boolean
  /** Accounts + savings boxes + investments − open card bills. */
  netWorth: Cents
  byAccount: { account: Account; balance: Cents }[]
}

export function balanceSummary(
  snapshot: Pick<FinanceSnapshot, 'accounts' | 'transactions' | 'portfolio'>,
): BalanceSummary {
  const byAccount = snapshot.accounts.map((account) => ({
    account,
    balance: accountBalance(account, snapshot.transactions),
  }))
  const total = (kinds: readonly AccountKind[]) =>
    sumCents(byAccount.filter((row) => kinds.includes(row.account.kind)).map((row) => row.balance))

  const inAccounts = total(LIQUID)
  const cardBalance = total(['credit_card'])
  const openCardBills = cents(Math.max(0, -cardBalance))
  const boxes = total(['savings_box'])
  const investments = snapshot.portfolio?.marketValue ?? total(['investment'])

  return {
    inAccounts,
    openCardBills,
    hasCreditCard: snapshot.accounts.some((a) => a.kind === 'credit_card'),
    netWorth: cents(inAccounts + boxes + investments - openCardBills),
    byAccount,
  }
}

function isSaving(tx: Transaction, accounts: readonly Account[]): boolean {
  if (tx.kind !== 'transfer') return false
  const destination = accounts.find((a) => a.id === tx.counterAccountId)
  return destination !== undefined && SAVING_DESTINATIONS.includes(destination.kind)
}

export interface CycleTotals {
  income: Cents
  expenses: Cents
  saved: Cents
}

function totalsBetween(
  transactions: readonly Transaction[],
  accounts: readonly Account[],
  from: LocalDate,
  to: LocalDate,
): CycleTotals {
  const inCycle = transactions.filter((tx) => inRange(tx.occurredOn, from, to))
  const sumOf = (pick: (tx: Transaction) => boolean) =>
    sumCents(inCycle.filter(pick).map((tx) => tx.amount))
  return {
    income: sumOf((tx) => tx.kind === 'income'),
    expenses: sumOf((tx) => tx.kind === 'expense'),
    saved: sumOf((tx) => isSaving(tx, accounts)),
  }
}

export interface CycleComparison {
  from: LocalDate
  to: LocalDate
  current: CycleTotals
  /** Same span of the previous cycle (day 1 to the same day), for a fair comparison. */
  previous: CycleTotals
  previousFrom: LocalDate
  previousTo: LocalDate
}

/** Cycle starts on day 1 (configurable cycle start comes with the API in phase 2). */
export function cycleComparison(
  snapshot: Pick<FinanceSnapshot, 'accounts' | 'transactions'>,
  today: LocalDate,
): CycleComparison {
  const from = startOfMonth(today)
  const previousTo = sameDayPreviousMonth(today)
  const previousFrom = startOfMonth(previousTo)
  return {
    from,
    to: today,
    current: totalsBetween(snapshot.transactions, snapshot.accounts, from, today),
    previous: totalsBetween(snapshot.transactions, snapshot.accounts, previousFrom, previousTo),
    previousFrom,
    previousTo,
  }
}

/** Percentage change, or null when there is no base to compare against. */
export function changePercent(current: Cents, previous: Cents): number | null {
  if (previous === 0) return null
  return Math.round(((current - previous) * 100) / previous)
}

function dueDateInMonth(recurrence: Recurrence, anyDayOfMonth: LocalDate): LocalDate {
  const lastDay = dayOfMonth(endOfMonth(anyDayOfMonth))
  return addDays(startOfMonth(anyDayOfMonth), Math.min(recurrence.dayOfMonth, lastDay) - 1)
}

function paidInCycle(
  recurrence: Recurrence,
  transactions: readonly Transaction[],
  from: LocalDate,
  to: LocalDate,
): boolean {
  return transactions.some(
    (tx) => tx.recurrenceId === recurrence.id && inRange(tx.occurredOn, from, to),
  )
}

export type IncomeAllocation =
  | { status: 'no-income' }
  | {
      status: 'overflow'
      income: Cents
      used: Cents
      excess: Cents
    }
  | {
      status: 'ok'
      income: Cents
      /** Part of `income` that is expected by recurrence but not received yet. */
      incomeForecast: Cents
      fixedPaid: Cents
      /** Fixed commitments due later in the cycle and not paid yet (drawn hatched). */
      fixedPlanned: Cents
      variable: Cents
      saved: Cents
      available: Cents
    }

/**
 * "Para onde foi sua renda" (briefing §8): the whole is the cycle's income, received plus
 * forecast. Four slices: fixed commitments, variable spending, saved and invested, available.
 * Available already discounts fixed commitments still to be paid this cycle.
 */
export function incomeAllocation(
  snapshot: Pick<FinanceSnapshot, 'accounts' | 'transactions' | 'recurrences'>,
  today: LocalDate,
): IncomeAllocation {
  const from = startOfMonth(today)
  const to = endOfMonth(today)
  const cycleTx = snapshot.transactions.filter((tx) => inRange(tx.occurredOn, from, to))
  const sumOf = (pick: (tx: Transaction) => boolean) =>
    sumCents(cycleTx.filter(pick).map((tx) => tx.amount))
  const unpaid = snapshot.recurrences.filter(
    (r) => !paidInCycle(r, snapshot.transactions, from, to),
  )

  // Conservative on both sides: late income is not counted on, unpaid commitments always are.
  const incomeReceived = sumOf((tx) => tx.kind === 'income')
  const incomeForecast = sumCents(
    unpaid
      .filter((r) => r.kind === 'income' && dueDateInMonth(r, today) >= today)
      .map((r) => r.expectedAmount),
  )
  const income = cents(incomeReceived + incomeForecast)
  if (income === 0) return { status: 'no-income' }

  const fixedPaid = sumOf((tx) => tx.kind === 'expense' && tx.nature === 'fixed')
  const variable = sumOf((tx) => tx.kind === 'expense' && tx.nature !== 'fixed')
  const saved = sumOf((tx) => isSaving(tx, snapshot.accounts))
  const fixedPlanned = sumCents(
    unpaid.filter((r) => r.kind === 'expense').map((r) => r.expectedAmount),
  )

  const used = cents(fixedPaid + fixedPlanned + variable + saved)
  if (used > income) return { status: 'overflow', income, used, excess: cents(used - income) }

  return {
    status: 'ok',
    income,
    incomeForecast,
    fixedPaid,
    fixedPlanned,
    variable,
    saved,
    available: cents(income - used),
  }
}

export interface UpcomingCharge {
  recurrence: Recurrence
  dueOn: LocalDate
  daysUntil: number
}

/** Expense recurrences due in the next `days` days that were not paid yet. */
export function upcomingCharges(
  snapshot: Pick<FinanceSnapshot, 'transactions' | 'recurrences'>,
  today: LocalDate,
  days = 15,
): UpcomingCharge[] {
  const horizon = addDays(today, days)
  const charges: UpcomingCharge[] = []
  for (const recurrence of snapshot.recurrences.filter((r) => r.kind === 'expense')) {
    for (const month of [today, addDays(endOfMonth(today), 1)]) {
      const dueOn = dueDateInMonth(recurrence, month)
      if (!inRange(dueOn, today, horizon)) continue
      if (paidInCycle(recurrence, snapshot.transactions, startOfMonth(dueOn), endOfMonth(dueOn)))
        continue
      charges.push({ recurrence, dueOn, daysUntil: daysBetween(today, dueOn) })
    }
  }
  return charges.sort((a, b) => a.daysUntil - b.daysUntil)
}

export function pendingReviewCount(transactions: readonly Transaction[], today: LocalDate): number {
  const from = startOfMonth(today)
  return transactions.filter(
    (tx) => tx.reviewStatus === 'pending' && inRange(tx.occurredOn, from, today),
  ).length
}

export function recentTransactions(transactions: readonly Transaction[], limit = 5): Transaction[] {
  return [...transactions]
    .sort((a, b) =>
      a.occurredOn === b.occurredOn
        ? b.id.localeCompare(a.id)
        : b.occurredOn.localeCompare(a.occurredOn),
    )
    .slice(0, limit)
}

export type AllocationSlice = 'fixed' | 'variable' | 'saved'

export interface SliceDetail {
  transactions: Transaction[]
  /** Fixed commitments not paid yet in the cycle (only for `fixed`). */
  planned: Recurrence[]
}

/** What makes up each slice of the income donut, so every number can be drilled down. */
export function sliceDetail(
  snapshot: Pick<FinanceSnapshot, 'accounts' | 'transactions' | 'recurrences'>,
  today: LocalDate,
  slice: AllocationSlice,
): SliceDetail {
  const from = startOfMonth(today)
  const to = endOfMonth(today)
  const cycleTx = snapshot.transactions.filter((tx) => inRange(tx.occurredOn, from, to))
  const pick: Record<AllocationSlice, (tx: Transaction) => boolean> = {
    fixed: (tx) => tx.kind === 'expense' && tx.nature === 'fixed',
    variable: (tx) => tx.kind === 'expense' && tx.nature !== 'fixed',
    saved: (tx) => isSaving(tx, snapshot.accounts),
  }
  return {
    transactions: recentTransactions(cycleTx.filter(pick[slice]), Infinity),
    planned:
      slice === 'fixed'
        ? snapshot.recurrences.filter(
            (r) => r.kind === 'expense' && !paidInCycle(r, snapshot.transactions, from, to),
          )
        : [],
  }
}
