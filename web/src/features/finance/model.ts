import type { Cents } from '@/lib/money'
import type { LocalDate } from '@/lib/dates'

/** Shapes follow the draft schema in docs/diagnostico.md §5.1, so the API can replace the demo data. */

export type AccountKind =
  'checking' | 'savings' | 'cash' | 'credit_card' | 'savings_box' | 'investment'

export interface Account {
  id: string
  name: string
  kind: AccountKind
  institution?: string
  openingBalance: Cents
}

export type TransactionKind = 'income' | 'expense' | 'transfer'
export type Nature = 'fixed' | 'variable'

export interface Transaction {
  id: string
  kind: TransactionKind
  /** Always positive; direction comes from `kind` and the accounts. */
  amount: Cents
  occurredOn: LocalDate
  accountId: string
  /** Destination account of a transfer. */
  counterAccountId?: string
  category: string
  nature?: Nature
  description: string
  recurrenceId?: string
  reviewStatus: 'ok' | 'pending'
}

export interface Recurrence {
  id: string
  name: string
  kind: 'income' | 'expense'
  expectedAmount: Cents
  dayOfMonth: number
  category: string
  isSubscription: boolean
}

export interface SavingsBox {
  accountId: string
  target: Cents
  targetDate?: LocalDate
}

export interface Portfolio {
  invested: Cents
  marketValue: Cents
}

export interface FinanceSnapshot {
  userFirstName: string
  accounts: Account[]
  transactions: Transaction[]
  recurrences: Recurrence[]
  savingsBoxes: SavingsBox[]
  portfolio: Portfolio | null
}
