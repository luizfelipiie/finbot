import { useState } from 'react'
import { formatMoney, parseMoneyInput, type Cents } from '@/lib/money'
import { cn } from '@/lib/cn'
import { Field, controlClass } from './Field'

interface MoneyInputProps {
  label: string
  value: Cents | null
  onChange: (value: Cents | null) => void
  hint?: string
  /** Error from the form (e.g. "Informe um valor maior que zero"). */
  error?: string
  disabled?: boolean
}

const withoutSymbol = (value: Cents) => formatMoney(value).replace(/^R\$\s/, '')

/**
 * Free typing in pt-BR ("1.234,56", "50", "12,5"), normalized on blur.
 * Unreadable text is reported instead of silently becoming another number (bug C-01).
 */
export function MoneyInput({ label, value, onChange, hint, error, disabled }: MoneyInputProps) {
  const [text, setText] = useState(value === null ? '' : withoutSymbol(value))
  const [unreadable, setUnreadable] = useState(false)
  const shownError = unreadable ? 'Não entendi esse valor. Use o formato 1.234,56.' : error

  return (
    <Field label={label} hint={hint ?? 'Ex.: 1.234,56'} error={shownError}>
      {(field) => (
        <div className="relative">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-fg-muted"
          >
            R$
          </span>
          <input
            {...field}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            disabled={disabled}
            value={text}
            onChange={(event) => {
              setText(event.target.value)
              setUnreadable(false)
              onChange(parseMoneyInput(event.target.value))
            }}
            onBlur={() => {
              if (text.trim() === '') return
              const parsed = parseMoneyInput(text)
              if (parsed === null) {
                setUnreadable(true)
              } else {
                setText(withoutSymbol(parsed))
              }
            }}
            className={cn(controlClass(Boolean(shownError)), 'pl-10 tabular')}
          />
        </div>
      )}
    </Field>
  )
}
