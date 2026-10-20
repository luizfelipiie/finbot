/**
 * Money is always an integer number of centavos. Floats never hold amounts;
 * Intl receives an exact decimal string built from the integer.
 */
export type Cents = number & { readonly __brand: 'Cents' }

export function cents(value: number): Cents {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`Cents must be a safe integer, got ${value}`)
  }
  return value as Cents
}

export function sumCents(values: readonly Cents[]): Cents {
  return cents(values.reduce<number>((total, value) => total + value, 0))
}

/** U+2212 MINUS SIGN: typographically correct and read as "menos" by screen readers. */
const MINUS = String.fromCharCode(0x2212)

function toDecimalString(value: Cents): string {
  const abs = Math.abs(value)
  const integer = Math.trunc(abs / 100)
  const fraction = String(abs % 100).padStart(2, '0')
  return `${integer}.${fraction}` as const
}

const fullFormat = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const compactFormat = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
})

type SignMode = 'auto' | 'always'

function signFor(value: Cents, mode: SignMode): string {
  if (value < 0) return `${MINUS} `
  if (mode === 'always' && value > 0) return '+ '
  return ''
}

type DecimalString = `${number}`

/** "R$ 4.218,35"; negative as "− R$ 4.218,35"; `sign: 'always'` adds "+ ". */
export function formatMoney(value: Cents, options: { sign?: SignMode } = {}): string {
  return (
    signFor(value, options.sign ?? 'auto') +
    fullFormat.format(toDecimalString(value) as DecimalString)
  )
}

/** "R$ 4,2 mil", "R$ 1,3 mi". Below R$ 1.000 shows the full value (never "R$ 1 mil" for 999,99). */
export function formatMoneyCompact(value: Cents, options: { sign?: SignMode } = {}): string {
  if (Math.abs(value) < 100_000) return formatMoney(value, options)
  return (
    signFor(value, options.sign ?? 'auto') +
    compactFormat.format(toDecimalString(value) as DecimalString)
  )
}

export interface MoneyParts {
  sign: string
  currency: string
  integer: string
  decimal: string
  fraction: string
}

/** Pieces for display where "R$" and centavos are rendered smaller than the integer part. */
export function moneyParts(value: Cents, options: { sign?: SignMode } = {}): MoneyParts {
  const parts = fullFormat.formatToParts(toDecimalString(value) as DecimalString)
  const pick = (type: Intl.NumberFormatPartTypes) =>
    parts
      .filter((part) => part.type === type)
      .map((part) => part.value)
      .join('')
  return {
    sign: signFor(value, options.sign ?? 'auto').trim(),
    currency: pick('currency'),
    integer: parts
      .filter((part) => part.type === 'integer' || part.type === 'group')
      .map((part) => part.value)
      .join(''),
    decimal: pick('decimal'),
    fraction: pick('fraction'),
  }
}

/**
 * Parses what a person types in pt-BR: "1.234,56", "1.500", "50", "R$ 50,5", "12.5".
 * A dot followed by exactly three digits is a thousands separator; otherwise a dot with
 * one or two digits at the end is read as a decimal point. Returns null when ambiguous,
 * empty, negative or malformed.
 */
export function parseMoneyInput(text: string): Cents | null {
  // \s also matches the no-break space Intl puts after "R$".
  const cleaned = text.replace(/R\$/gi, '').replace(/\s/g, '')
  if (cleaned === '') return null

  let integerPart: string
  let fractionPart = ''

  if (cleaned.includes(',')) {
    const match = /^(\d{1,3}(?:\.\d{3})*|\d+),(\d{1,2})?$/.exec(cleaned)
    if (!match) return null
    integerPart = (match[1] ?? '').replaceAll('.', '')
    fractionPart = match[2] ?? ''
  } else if (/^\d{1,3}(?:\.\d{3})+$/.test(cleaned)) {
    integerPart = cleaned.replaceAll('.', '')
  } else if (/^\d+\.\d{1,2}$/.test(cleaned)) {
    const [whole = '', fraction = ''] = cleaned.split('.')
    integerPart = whole
    fractionPart = fraction
  } else if (/^\d+$/.test(cleaned)) {
    integerPart = cleaned
  } else {
    return null
  }

  const value = Number(integerPart) * 100 + Number(fractionPart.padEnd(2, '0'))
  return Number.isSafeInteger(value) ? cents(value) : null
}

/** Share of `part` in `total` as an integer percentage (0 when total is 0). */
export function percentOf(part: Cents, total: Cents): number {
  if (total === 0) return 0
  return Math.round((part * 100) / total)
}

const percentFormats = new Map<number, Intl.NumberFormat>()

/** "12%", "4,5%"; `sign: 'always'` gives "+ 4,5%". Input is a percentage (4.5 means 4,5%). */
export function formatPercent(
  percent: number,
  options: { fractionDigits?: number; sign?: SignMode } = {},
): string {
  const digits = options.fractionDigits ?? 0
  let format = percentFormats.get(digits)
  if (!format) {
    format = new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })
    percentFormats.set(digits, format)
  }
  const sign = percent < 0 ? `${MINUS} ` : options.sign === 'always' && percent > 0 ? '+ ' : ''
  return sign + format.format(Math.abs(percent) / 100)
}

/** Return of `current` over `base` in percent with one decimal, or null without a base. */
export function returnPercent(current: Cents, base: Cents): number | null {
  if (base === 0) return null
  return Math.round(((current - base) * 1000) / base) / 10
}
