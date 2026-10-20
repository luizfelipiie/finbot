/**
 * Calendar dates are "YYYY-MM-DD" strings in the user's time zone. Arithmetic runs on UTC
 * midnights, which never cross DST or offset boundaries.
 */
export type LocalDate = string & { readonly __brand: 'LocalDate' }

export const DEFAULT_TIME_ZONE = 'America/Sao_Paulo'

const MONTHS_SHORT = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
]
const MONTHS_LONG = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

const DAY_MS = 86_400_000

export function localDate(text: string): LocalDate {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text)
  if (!match) throw new RangeError(`Invalid local date: ${text}`)
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const probe = new Date(Date.UTC(year, month - 1, day))
  if (probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) {
    throw new RangeError(`Invalid local date: ${text}`)
  }
  return text as LocalDate
}

function parts(date: LocalDate): { year: number; month: number; day: number } {
  const [year = 0, month = 0, day = 0] = date.split('-').map(Number)
  return { year, month, day }
}

const pad2 = (n: number) => String(n).padStart(2, '0')

function fromUtc(ms: number): LocalDate {
  const d = new Date(ms)
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}` as LocalDate
}

function toUtc(date: LocalDate): number {
  const { year, month, day } = parts(date)
  return Date.UTC(year, month - 1, day)
}

/** Today's calendar date in `timeZone`, not in UTC. */
export function todayIn(timeZone: string = DEFAULT_TIME_ZONE, now: Date = new Date()): LocalDate {
  const formatted = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
  return localDate(formatted)
}

export function hourIn(timeZone: string = DEFAULT_TIME_ZONE, now: Date = new Date()): number {
  const hour = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    hourCycle: 'h23',
  }).format(now)
  return Number(hour)
}

export function addDays(date: LocalDate, days: number): LocalDate {
  return fromUtc(toUtc(date) + days * DAY_MS)
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  return Math.round((toUtc(to) - toUtc(from)) / DAY_MS)
}

export function dayOfMonth(date: LocalDate): number {
  return parts(date).day
}

/** Same day number in the previous month, clamped to that month's last day. */
export function sameDayPreviousMonth(date: LocalDate): LocalDate {
  const { year, month, day } = parts(date)
  const lastDayOfPrevious = new Date(Date.UTC(year, month - 1, 0)).getUTCDate()
  return fromUtc(Date.UTC(year, month - 2, Math.min(day, lastDayOfPrevious)))
}

export function startOfMonth(date: LocalDate): LocalDate {
  const { year, month } = parts(date)
  return fromUtc(Date.UTC(year, month - 1, 1))
}

/** "Hoje", "Ontem", "19 out" (same year) or "19/10/2026". */
export function formatRelativeDate(date: LocalDate, today: LocalDate): string {
  const diff = daysBetween(date, today)
  if (diff === 0) return 'Hoje'
  if (diff === 1) return 'Ontem'
  if (parts(date).year === parts(today).year) return formatDayMonth(date)
  return formatNumericDate(date)
}

export function formatNumericDate(date: LocalDate): string {
  const { year, month, day } = parts(date)
  return `${pad2(day)}/${pad2(month)}/${year}`
}

/** "19 out" */
export function formatDayMonth(date: LocalDate): string {
  const { month, day } = parts(date)
  return `${day} ${MONTHS_SHORT[month - 1]}`
}

/** "Outubro de 2026" */
export function formatMonthYear(date: LocalDate): string {
  const { year } = parts(date)
  const name = monthName(date)
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} de ${year}`
}

/** "outubro" */
export function monthName(date: LocalDate): string {
  return MONTHS_LONG[parts(date).month - 1] ?? ''
}

export function greetingFor(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Bom dia'
  if (hour >= 12 && hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

/** "hoje", "amanhã", "em 3 dias" */
export function formatDaysUntil(days: number): string {
  if (days <= 0) return 'hoje'
  if (days === 1) return 'amanhã'
  return `em ${days} dias`
}

export function endOfMonth(date: LocalDate): LocalDate {
  const { year, month } = parts(date)
  return fromUtc(Date.UTC(year, month, 0))
}
