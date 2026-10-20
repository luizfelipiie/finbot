// @vitest-environment node
import {
  cents,
  formatMoney,
  formatMoneyCompact,
  formatPercent,
  moneyParts,
  parseMoneyInput,
  percentOf,
  returnPercent,
  sumCents,
} from './money'

// Intl uses a no-break space between "R$" and the number.
const NBSP = String.fromCharCode(0xa0)
const MINUS = String.fromCharCode(0x2212)
const nb = (text: string) => text.replaceAll(' ', NBSP)

describe('cents', () => {
  it('rejects non-integers', () => {
    expect(() => cents(10.5)).toThrow(RangeError)
    expect(() => cents(Number.NaN)).toThrow(RangeError)
  })

  it('sums without float drift', () => {
    expect(sumCents([cents(10), cents(20)])).toBe(30)
  })
})

describe('formatMoney', () => {
  it('formats pt-BR with thousands and centavos', () => {
    expect(formatMoney(cents(123456789))).toBe(nb('R$ 1.234.567,89'))
    expect(formatMoney(cents(5))).toBe(nb('R$ 0,05'))
    expect(formatMoney(cents(0))).toBe(nb('R$ 0,00'))
  })

  it('uses a real minus sign for negatives and optional plus', () => {
    expect(formatMoney(cents(-421835))).toBe(`${MINUS} ${nb('R$ 4.218,35')}`)
    expect(formatMoney(cents(1000), { sign: 'always' })).toBe(`+ ${nb('R$ 10,00')}`)
    expect(formatMoney(cents(0), { sign: 'always' })).toBe(nb('R$ 0,00'))
  })
})

describe('formatMoneyCompact', () => {
  it('abbreviates as "mil" and "mi", never "k"', () => {
    expect(formatMoneyCompact(cents(421835))).toBe(nb('R$ 4,2 mil'))
    expect(formatMoneyCompact(cents(125000000))).toBe(nb('R$ 1,3 mi'))
  })

  it('keeps values below R$ 1.000 in full', () => {
    expect(formatMoneyCompact(cents(99999))).toBe(nb('R$ 999,99'))
  })
})

describe('moneyParts', () => {
  it('splits currency, integer and centavos', () => {
    expect(moneyParts(cents(421835))).toEqual({
      sign: '',
      currency: 'R$',
      integer: '4.218',
      decimal: ',',
      fraction: '35',
    })
  })
})

describe('parseMoneyInput', () => {
  it.each([
    ['1.234,56', 123456],
    ['1.500', 150000],
    ['1.500,00', 150000],
    ['50', 5000],
    ['R$ 50,5', 5050],
    [`R$${NBSP}1.234,56`, 123456],
    ['12.5', 1250],
    ['12.50', 1250],
    ['0,99', 99],
    ['10,', 1000],
    ['1234,56', 123456],
  ])('reads %s as %i centavos', (input, expected) => {
    expect(parseMoneyInput(input)).toBe(expected)
  })

  it.each(['', '   ', 'abc', '-50', '1,2,3', '1.23.4', '12.345,6.7', '1,234'])(
    'rejects %j',
    (input) => {
      expect(parseMoneyInput(input)).toBeNull()
    },
  )
})

describe('percentOf', () => {
  it('rounds to integer percent and handles zero total', () => {
    expect(percentOf(cents(1), cents(3))).toBe(33)
    expect(percentOf(cents(1), cents(0))).toBe(0)
  })
})

describe('formatPercent and returnPercent', () => {
  it('formats pt-BR percentages with explicit sign', () => {
    expect(formatPercent(12)).toBe('12%')
    expect(formatPercent(4.5, { fractionDigits: 1, sign: 'always' })).toBe('+ 4,5%')
    expect(formatPercent(-3, { sign: 'always' })).toBe(`${MINUS} 3%`)
  })

  it('computes return with one decimal', () => {
    expect(returnPercent(cents(1923652), cents(1840000))).toBe(4.5)
    expect(returnPercent(cents(100), cents(0))).toBeNull()
  })
})
