import { cents, sumCents } from '@/lib/money'
import {
  addDays,
  dayOfMonth,
  endOfMonth,
  sameDayPreviousMonth,
  startOfMonth,
  type LocalDate,
} from '@/lib/dates'
import type { Account, FinanceSnapshot, Recurrence, Transaction } from './model'

/**
 * Fictional data for the phase 1 prototype. Dates are generated relative to "today" so the
 * screen always looks like a real month in progress. No real person, bank or brand.
 */
export type DemoScenario = 'normal' | 'overflow' | 'no-income'

const accounts: Account[] = [
  { id: 'checking', name: 'Conta corrente', kind: 'checking', openingBalance: cents(412_30) },
  { id: 'savings', name: 'Poupança', kind: 'savings', openingBalance: cents(2_350_00) },
  { id: 'cash', name: 'Carteira', kind: 'cash', openingBalance: cents(180_00) },
  { id: 'card', name: 'Cartão de crédito', kind: 'credit_card', openingBalance: cents(0) },
  {
    id: 'box-emergency',
    name: 'Reserva de emergência',
    kind: 'savings_box',
    openingBalance: cents(5_700_00),
  },
  {
    id: 'box-trip',
    name: 'Viagem de fim de ano',
    kind: 'savings_box',
    openingBalance: cents(2_800_00),
  },
  { id: 'box-laptop', name: 'Notebook novo', kind: 'savings_box', openingBalance: cents(3_900_00) },
]

const rec = (
  id: string,
  name: string,
  kind: Recurrence['kind'],
  amount: number,
  dayOfMonthDue: number,
  category: string,
  isSubscription = false,
): Recurrence => ({
  id,
  name,
  kind,
  expectedAmount: cents(amount),
  dayOfMonth: dayOfMonthDue,
  category,
  isSubscription,
})

const recurrences: Recurrence[] = [
  rec('salary', 'Salário', 'income', 6_200_00, 5, 'Salário'),
  rec('gym', 'Academia', 'expense', 109_90, 1, 'Saúde', true),
  rec('music', 'Streaming de música', 'expense', 21_90, 2, 'Assinaturas', true),
  rec('rent', 'Aluguel', 'expense', 1_850_00, 10, 'Moradia'),
  rec('condo', 'Condomínio', 'expense', 480_00, 10, 'Moradia'),
  rec('power', 'Conta de luz', 'expense', 186_40, 15, 'Moradia'),
  rec('internet', 'Internet', 'expense', 119_90, 22, 'Moradia', true),
  rec('phone', 'Plano de celular', 'expense', 59_90, 24, 'Moradia', true),
  rec('video', 'Streaming de vídeo', 'expense', 55_90, 27, 'Assinaturas', true),
]

interface VariableSpend {
  day: number
  amount: number
  description: string
  category: string
  account: 'checking' | 'card' | 'cash'
  pending?: boolean
}

const variableSpending: VariableSpend[] = [
  { day: 2, amount: 312_45, description: 'Supermercado', category: 'Mercado', account: 'card' },
  { day: 3, amount: 18_50, description: 'Padaria', category: 'Alimentação', account: 'cash' },
  {
    day: 4,
    amount: 27_90,
    description: 'Transporte por aplicativo',
    category: 'Transporte',
    account: 'card',
  },
  { day: 7, amount: 89_00, description: 'Restaurante', category: 'Alimentação', account: 'card' },
  { day: 9, amount: 64_30, description: 'Farmácia', category: 'Saúde', account: 'checking' },
  { day: 12, amount: 241_80, description: 'Supermercado', category: 'Mercado', account: 'card' },
  {
    day: 13,
    amount: 150_00,
    description: 'Posto de combustível',
    category: 'Transporte',
    account: 'card',
    pending: true,
  },
  { day: 16, amount: 45_00, description: 'Cinema', category: 'Lazer', account: 'card' },
  {
    day: 17,
    amount: 132_99,
    description: 'Loja de roupas',
    category: 'Compras',
    account: 'card',
    pending: true,
  },
  {
    day: 18,
    amount: 22_40,
    description: 'Transporte por aplicativo',
    category: 'Transporte',
    account: 'card',
  },
  {
    day: 19,
    amount: 38_70,
    description: 'Lanchonete',
    category: 'Alimentação',
    account: 'cash',
    pending: true,
  },
  { day: 23, amount: 278_15, description: 'Supermercado', category: 'Mercado', account: 'card' },
  {
    day: 26,
    amount: 96_00,
    description: 'Presente de aniversário',
    category: 'Compras',
    account: 'card',
  },
]

const savingsBoxes = [
  { accountId: 'box-emergency', target: cents(15_000_00) },
  { accountId: 'box-trip', target: cents(4_500_00) },
  { accountId: 'box-laptop', target: cents(6_000_00) },
]

/** Builds one month of movements, up to `until`. */
function monthOfTransactions(
  monthStart: LocalDate,
  until: LocalDate,
  prefix: string,
  /** Percent applied to variable spending, so months differ. */
  spendingPercent = 100,
  savedToEmergency = 500_00,
): Transaction[] {
  const last = dayOfMonth(endOfMonth(monthStart))
  const on = (day: number) => addDays(monthStart, Math.min(day, last) - 1)
  const result: Transaction[] = []
  const push = (
    tx: Omit<Transaction, 'id' | 'reviewStatus'> & { reviewStatus?: Transaction['reviewStatus'] },
  ) => {
    if (tx.occurredOn > until) return
    result.push({
      reviewStatus: 'ok',
      ...tx,
      id: `${prefix}-${String(result.length).padStart(2, '0')}`,
    })
  }

  for (const r of recurrences) {
    push({
      kind: r.kind,
      amount: r.expectedAmount,
      occurredOn: on(r.dayOfMonth),
      accountId: r.kind === 'income' || !r.isSubscription ? 'checking' : 'card',
      category: r.category,
      nature: r.kind === 'expense' ? 'fixed' : undefined,
      description: r.name,
      recurrenceId: r.id,
    })
  }
  for (const spend of variableSpending) {
    push({
      kind: 'expense',
      amount: cents(Math.round((spend.amount * spendingPercent) / 100)),
      occurredOn: on(spend.day),
      accountId: spend.account,
      category: spend.category,
      nature: 'variable',
      description: spend.description,
      reviewStatus: spend.pending ? 'pending' : 'ok',
    })
  }
  push({
    kind: 'transfer',
    amount: cents(savedToEmergency),
    occurredOn: on(6),
    accountId: 'checking',
    counterAccountId: 'box-emergency',
    category: 'Caixinhas',
    description: 'Guardado na Reserva de emergência',
  })
  push({
    kind: 'transfer',
    amount: cents(300_00),
    occurredOn: on(6),
    accountId: 'checking',
    counterAccountId: 'box-trip',
    category: 'Caixinhas',
    description: 'Guardado na Viagem de fim de ano',
  })
  return result
}

/** The card bill of a month is paid on day 8 of the next month, as a transfer (never an expense). */
function billPayment(
  previous: Transaction[],
  monthStart: LocalDate,
  until: LocalDate,
): Transaction[] {
  const onEight = addDays(monthStart, 7)
  if (onEight > until) return []
  const bill = sumCents(
    previous
      .filter((tx) => tx.accountId === 'card' && tx.kind === 'expense')
      .map((tx) => tx.amount),
  )
  return [
    {
      id: 'bill-payment',
      kind: 'transfer',
      amount: bill,
      occurredOn: onEight,
      accountId: 'checking',
      counterAccountId: 'card',
      category: 'Fatura do cartão',
      description: 'Pagamento da fatura',
      reviewStatus: 'ok',
    },
  ]
}

export function demoSnapshot(today: LocalDate, scenario: DemoScenario = 'normal'): FinanceSnapshot {
  const currentStart = startOfMonth(today)
  const previousStart = startOfMonth(sameDayPreviousMonth(today))
  const previous = monthOfTransactions(previousStart, endOfMonth(previousStart), 'prev', 88, 200_00)
  let current = [
    ...monthOfTransactions(currentStart, today, 'cur'),
    ...billPayment(previous, currentStart, today),
  ]
  let currentRecurrences = recurrences

  if (scenario === 'overflow') {
    current = [
      ...current,
      {
        id: 'cur-zz-car',
        kind: 'expense',
        amount: cents(3_900_00),
        occurredOn: today,
        accountId: 'card',
        category: 'Transporte',
        nature: 'variable',
        description: 'Conserto do carro',
        reviewStatus: 'ok',
      },
    ]
  }
  if (scenario === 'no-income') {
    current = current.filter((tx) => tx.kind !== 'income')
    currentRecurrences = recurrences.filter((r) => r.kind !== 'income')
  }

  return {
    userFirstName: 'Ana',
    accounts,
    transactions: [...previous, ...current],
    recurrences: currentRecurrences,
    savingsBoxes,
    portfolio: { invested: cents(18_400_00), marketValue: cents(19_236_52) },
  }
}
