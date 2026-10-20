// @vitest-environment node
import {
  addDays,
  daysBetween,
  formatDaysUntil,
  formatMonthYear,
  formatRelativeDate,
  greetingFor,
  hourIn,
  localDate,
  sameDayPreviousMonth,
  startOfMonth,
  todayIn,
} from './dates'

describe('todayIn', () => {
  it('uses the user time zone, not UTC (bug C-02)', () => {
    // 23:30 in Brasília on Oct 19 is already Oct 20 in UTC.
    const now = new Date(Date.UTC(2026, 9, 20, 2, 30))
    expect(todayIn('America/Sao_Paulo', now)).toBe('2026-10-19')
    expect(todayIn('UTC', now)).toBe('2026-10-20')
  })

  it('keeps the last day of the month in the right month', () => {
    const now = new Date(Date.UTC(2026, 10, 1, 1, 0)) // Oct 31, 22:00 in Brasília
    expect(todayIn('America/Sao_Paulo', now)).toBe('2026-10-31')
  })
})

describe('hourIn', () => {
  it('returns the local hour', () => {
    expect(hourIn('America/Sao_Paulo', new Date(Date.UTC(2026, 9, 20, 2, 30)))).toBe(23)
  })
})

describe('localDate', () => {
  it('rejects impossible or non-ISO dates', () => {
    expect(() => localDate('2026-02-30')).toThrow(RangeError)
    expect(() => localDate('19/10/2026')).toThrow(RangeError)
  })
})

describe('arithmetic', () => {
  it('adds days across month and year boundaries', () => {
    expect(addDays(localDate('2026-12-31'), 1)).toBe('2027-01-01')
    expect(addDays(localDate('2026-03-01'), -1)).toBe('2026-02-28')
  })

  it('counts days between dates', () => {
    expect(daysBetween(localDate('2026-10-19'), localDate('2026-11-03'))).toBe(15)
  })

  it('clamps the same day in the previous month', () => {
    expect(sameDayPreviousMonth(localDate('2026-03-31'))).toBe('2026-02-28')
    expect(sameDayPreviousMonth(localDate('2026-01-19'))).toBe('2025-12-19')
    expect(startOfMonth(localDate('2026-10-19'))).toBe('2026-10-01')
  })
})

describe('formatting', () => {
  const today = localDate('2026-10-19')

  it.each([
    ['2026-10-19', 'Hoje'],
    ['2026-10-18', 'Ontem'],
    ['2026-10-02', '2 out'],
    ['2025-12-24', '24/12/2025'],
  ])('formats %s as %s', (date, expected) => {
    expect(formatRelativeDate(localDate(date), today)).toBe(expected)
  })

  it('formats month and year in pt-BR', () => {
    expect(formatMonthYear(today)).toBe('Outubro de 2026')
    expect(formatMonthYear(localDate('2026-03-01'))).toBe('Março de 2026')
  })

  it('greets by time of day', () => {
    expect(greetingFor(8)).toBe('Bom dia')
    expect(greetingFor(14)).toBe('Boa tarde')
    expect(greetingFor(23)).toBe('Boa noite')
    expect(greetingFor(3)).toBe('Boa noite')
  })

  it('describes days until a due date', () => {
    expect(formatDaysUntil(0)).toBe('hoje')
    expect(formatDaysUntil(1)).toBe('amanhã')
    expect(formatDaysUntil(6)).toBe('em 6 dias')
  })
})
