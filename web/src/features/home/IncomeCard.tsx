import { CircleAlert, ChevronRight } from 'lucide-react'
import { useId, useState } from 'react'
import { Amount } from '@/components/ui/Amount'
import { Card } from '@/components/ui/Card'
import { BottomSheet } from '@/components/ui/Dialog'
import { List, ListItem } from '@/components/ui/List'
import { EmptyState } from '@/components/ui/States'
import { usePrivacy } from '@/app/privacy'
import { sliceDetail, type AllocationSlice, type IncomeAllocation } from '@/features/finance/derive'
import type { FinanceSnapshot } from '@/features/finance/model'
import { endOfMonth, formatDayMonth, formatMonthYear, monthName, type LocalDate } from '@/lib/dates'
import { cn } from '@/lib/cn'
import {
  cents,
  formatMoney,
  formatMoneyCompact,
  formatPercent,
  percentOf,
  type Cents,
} from '@/lib/money'
import { TransactionRow } from './TransactionRow'

type Ok = Extract<IncomeAllocation, { status: 'ok' }>
type SliceKey = AllocationSlice | 'available'

interface Segment {
  key: string
  value: Cents
  /** CSS color or pattern reference; only tokens. */
  paint: string
}

const SIZE = 208
const STROKE = 28
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const GAP = 3

function Donut({ allocation, centerLabel }: { allocation: Ok; centerLabel: string }) {
  // useId output contains characters that break url(#...) references.
  const hatchId = `hatch-${useId().replace(/[^\w-]/g, '')}`
  const { hidden } = usePrivacy()
  const segments: Segment[] = [
    { key: 'fixed-paid', value: allocation.fixedPaid, paint: 'var(--c-chart-1)' },
    { key: 'fixed-planned', value: allocation.fixedPlanned, paint: `url(#${hatchId})` },
    { key: 'variable', value: allocation.variable, paint: 'var(--c-chart-2)' },
    { key: 'saved', value: allocation.saved, paint: 'var(--c-chart-3)' },
    { key: 'available', value: allocation.available, paint: 'var(--c-accent)' },
  ]
  let start = 0

  return (
    <div className="relative mx-auto w-full max-w-[208px] shrink-0">
      {/* The legend next to it carries every value as text; the drawing is decorative. */}
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden className="block w-full -rotate-90">
        <defs>
          <pattern
            id={hatchId}
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="6" height="6" fill="var(--c-surface-3)" />
            <rect width="2.5" height="6" fill="var(--c-chart-1)" />
          </pattern>
        </defs>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--c-surface-2)"
          strokeWidth={STROKE}
        />
        {segments.map((segment) => {
          const length = (segment.value / allocation.income) * CIRCUMFERENCE
          const offset = start
          start += length
          if (length <= GAP) return null
          return (
            <circle
              key={segment.key}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={segment.paint}
              strokeWidth={STROKE}
              strokeDasharray={`${length - GAP} ${CIRCUMFERENCE - length + GAP}`}
              strokeDashoffset={-offset}
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xs text-fg-muted">{centerLabel}</span>
        <span className="mt-0.5 text-xl font-semibold text-accent tabular">
          {hidden ? 'R$ ••••' : formatMoneyCompact(allocation.available)}
        </span>
      </div>
    </div>
  )
}

function Swatch({ paint, hatched = false }: { paint: string; hatched?: boolean }) {
  return (
    <span
      aria-hidden
      className="size-3 shrink-0 rounded-sm"
      style={
        hatched
          ? {
              background:
                'repeating-linear-gradient(135deg, var(--c-chart-1) 0 1.5px, var(--c-surface-3) 1.5px 4px)',
            }
          : { background: paint }
      }
    />
  )
}

interface LegendRow {
  key: SliceKey
  label: string
  value: Cents
  paint: string
  note?: string
  hatched?: boolean
}

function Legend({ allocation, onSelect }: { allocation: Ok; onSelect: (key: SliceKey) => void }) {
  const fixed = cents(allocation.fixedPaid + allocation.fixedPlanned)
  const rows: LegendRow[] = [
    {
      key: 'fixed',
      label: 'Compromissos fixos',
      value: fixed,
      paint: 'var(--c-chart-1)',
      note:
        allocation.fixedPlanned > 0
          ? `${formatMoney(allocation.fixedPlanned)} ainda a pagar`
          : undefined,
      hatched: allocation.fixedPlanned > 0,
    },
    {
      key: 'variable',
      label: 'Gastos variáveis',
      value: allocation.variable,
      paint: 'var(--c-chart-2)',
    },
    {
      key: 'saved',
      label: 'Guardado e investido',
      value: allocation.saved,
      paint: 'var(--c-chart-3)',
    },
    {
      key: 'available',
      label: 'Disponível',
      value: allocation.available,
      paint: 'var(--c-accent)',
    },
  ]
  const { hidden } = usePrivacy()

  return (
    <ul className="flex min-w-0 flex-1 flex-col">
      {rows.map((row) => (
        <li key={row.key} className="border-b border-border last:border-b-0">
          <button
            type="button"
            onClick={() => onSelect(row.key)}
            className="flex min-h-12 w-full items-center gap-3 rounded-md py-2 text-left transition-colors duration-150 ease-out hover:bg-surface-2 sm:-mx-2 sm:w-[calc(100%+16px)] sm:px-2"
          >
            <Swatch paint={row.paint} />
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  'block text-sm',
                  row.key === 'available' ? 'font-medium text-fg' : 'text-fg',
                )}
              >
                {row.label}
              </span>
              {row.note && (
                <span className="mt-0.5 flex items-center gap-1.5 text-xs text-fg-muted">
                  <Swatch paint={row.paint} hatched />
                  {hidden ? 'Valor previsto oculto' : row.note}
                </span>
              )}
            </span>
            <span className="flex flex-col items-end">
              <Amount value={row.value} size="sm" />
              <span className="text-xs text-fg-muted tabular">
                {formatPercent(percentOf(row.value, allocation.income))}
              </span>
            </span>
            <ChevronRight
              aria-hidden
              size={16}
              strokeWidth={1.5}
              className="shrink-0 text-fg-subtle"
            />
          </button>
        </li>
      ))}
    </ul>
  )
}

const SLICE_TITLE: Record<SliceKey, string> = {
  fixed: 'Compromissos fixos',
  variable: 'Gastos variáveis',
  saved: 'Guardado e investido',
  available: 'Disponível',
}

function SliceSheet({
  slice,
  onClose,
  snapshot,
  today,
  allocation,
}: {
  slice: SliceKey | null
  onClose: () => void
  snapshot: FinanceSnapshot
  today: LocalDate
  allocation: Ok
}) {
  const detail = slice && slice !== 'available' ? sliceDetail(snapshot, today, slice) : null
  const month = monthName(today)

  return (
    <BottomSheet
      open={slice !== null}
      onOpenChange={(open) => !open && onClose()}
      title={slice ? SLICE_TITLE[slice] : ''}
      description={formatMonthYear(today)}
    >
      {slice === 'available' && (
        <dl className="flex flex-col pb-2 text-sm">
          {[
            ['Renda do ciclo', allocation.income],
            ['Compromissos fixos pagos', cents(-allocation.fixedPaid)],
            ['Compromissos fixos a pagar', cents(-allocation.fixedPlanned)],
            ['Gastos variáveis', cents(-allocation.variable)],
            ['Guardado e investido', cents(-allocation.saved)],
          ].map(([label, value]) => (
            <div key={label as string} className="flex justify-between border-b border-border py-3">
              <dt className="text-fg-muted">{label as string}</dt>
              <dd>
                <Amount value={value as Cents} size="sm" />
              </dd>
            </div>
          ))}
          <div className="flex justify-between py-3 font-medium">
            <dt>Disponível</dt>
            <dd>
              <Amount value={allocation.available} size="sm" className="text-accent" />
            </dd>
          </div>
        </dl>
      )}
      {detail && (
        <div className="flex flex-col gap-4 pb-2">
          {detail.planned.length > 0 && (
            <section aria-label="A pagar">
              <h3 className="mb-1 text-sm font-medium text-fg-muted">A pagar em {month}</h3>
              <List>
                {detail.planned.map((r) => (
                  <ListItem
                    key={r.id}
                    title={r.name}
                    subtitle={`Vence dia ${r.dayOfMonth}`}
                    trailing={<Amount value={cents(-r.expectedAmount)} size="sm" />}
                    trailingSubtitle="Previsto"
                  />
                ))}
              </List>
            </section>
          )}
          <section aria-label="Lançamentos">
            {detail.planned.length > 0 && (
              <h3 className="mb-1 text-sm font-medium text-fg-muted">Já lançado</h3>
            )}
            {detail.transactions.length === 0 ? (
              <EmptyState title={`Nada lançado em ${month}.`} />
            ) : (
              <List>
                {detail.transactions.map((tx) => (
                  <TransactionRow key={tx.id} tx={tx} today={today} />
                ))}
              </List>
            )}
          </section>
        </div>
      )}
    </BottomSheet>
  )
}

export function IncomeCard({
  allocation,
  snapshot,
  today,
}: {
  allocation: IncomeAllocation
  snapshot: FinanceSnapshot
  today: LocalDate
}) {
  const [slice, setSlice] = useState<SliceKey | null>(null)
  const month = monthName(today)

  return (
    <Card title="Para onde foi sua renda" subtitle={formatMonthYear(today)}>
      {allocation.status === 'no-income' && (
        <EmptyState
          title={`Nenhuma receita registrada em ${month}.`}
          description="Registre sua renda pelo botão + para ver quanto já está comprometido e quanto ainda está disponível."
        />
      )}

      {allocation.status === 'overflow' && (
        <div className="flex flex-col gap-4">
          <p className="flex items-start gap-2 text-sm text-negative">
            <CircleAlert aria-hidden size={20} strokeWidth={1.5} className="shrink-0" />
            <span>
              Você usou <Amount value={allocation.excess} size="sm" className="font-semibold" /> a
              mais do que recebeu.
            </span>
          </p>
          <div aria-hidden className="flex h-3 overflow-hidden rounded-sm bg-surface-3">
            <div
              className="h-full bg-chart-2"
              style={{ width: `${(allocation.income / allocation.used) * 100}%` }}
            />
            <div className="ml-0.5 h-full flex-1 bg-negative" />
          </div>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs text-fg-muted">Recebido e previsto</dt>
              <dd>
                <Amount value={allocation.income} size="sm" />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-fg-muted">Gasto, a pagar e guardado</dt>
              <dd>
                <Amount value={allocation.used} size="sm" />
              </dd>
            </div>
          </dl>
        </div>
      )}

      {allocation.status === 'ok' && (
        <>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
            <Donut allocation={allocation} centerLabel="Disponível" />
            <Legend allocation={allocation} onSelect={setSlice} />
          </div>
          <p className="mt-4 text-xs text-fg-muted">
            Renda de <Amount value={allocation.income} size="sm" className="text-xs" />
            {allocation.incomeForecast > 0 && (
              <>
                , incluindo{' '}
                <Amount value={allocation.incomeForecast} size="sm" className="text-xs" /> previstos
              </>
            )}
            . O disponível já desconta o que vence até {formatDayMonth(endOfMonth(today))}.
          </p>
          <SliceSheet
            slice={slice}
            onClose={() => setSlice(null)}
            snapshot={snapshot}
            today={today}
            allocation={allocation}
          />
        </>
      )}
    </Card>
  )
}
