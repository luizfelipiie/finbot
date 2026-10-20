// @vitest-environment node
import { readFileSync } from 'node:fs'
import { contrastRatio } from './contrast'

const tokensCss = readFileSync(new URL('../styles/tokens.css', import.meta.url), 'utf8')

/** Reads `--c-*` hex values per selector block of tokens.css (the single source of truth). */
function readTokens(): Map<string, Record<string, string>> {
  const blocks = new Map<string, Record<string, string>>()
  const css = tokensCss.replace(/\/\*[\s\S]*?\*\//g, '')
  for (const [, selector = '', body = ''] of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const values: Record<string, string> = {}
    for (const [, name = '', value = ''] of body.matchAll(/--c-([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)) {
      values[name] = value.toLowerCase()
    }
    blocks.set(selector.trim(), values)
  }
  return blocks
}

const blocks = readTokens()
const base = blocks.get(':root') ?? {}
const accents = ['ambar', 'quente', 'lima'].map((name) => ({
  name,
  tokens: { ...base, ...blocks.get(`:root[data-accent='${name}']`) },
}))

const token = (tokens: Record<string, string>, name: string) => {
  const value = tokens[name]
  if (!value) throw new Error(`Missing token --c-${name}`)
  return value
}

const TEXT_AA = 4.5
const NON_TEXT_AA = 3

const surfaces = ['bg', 'surface-1', 'surface-2', 'surface-3']

describe('contrastRatio', () => {
  it('matches known WCAG values', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 2)
  })
})

describe('design tokens meet WCAG 2.2 AA', () => {
  it('defines all three accent options', () => {
    for (const { name } of accents) expect(blocks.has(`:root[data-accent='${name}']`)).toBe(true)
  })

  describe.each(['fg', 'fg-muted', 'fg-subtle', 'positive', 'negative', 'warning'])(
    'text color %s',
    (fg) => {
      it.each(surfaces)('on %s ≥ 4.5:1', (surface) => {
        expect(contrastRatio(token(base, fg), token(base, surface))).toBeGreaterThanOrEqual(TEXT_AA)
      })
    },
  )

  describe.each(accents)('accent $name', ({ tokens }) => {
    it.each(surfaces)('as text on %s ≥ 4.5:1', (surface) => {
      expect(contrastRatio(token(tokens, 'accent'), token(tokens, surface))).toBeGreaterThanOrEqual(
        TEXT_AA,
      )
    })

    it('ink on accent and on accent-hover ≥ 4.5:1', () => {
      const ink = token(tokens, 'accent-ink')
      expect(contrastRatio(ink, token(tokens, 'accent'))).toBeGreaterThanOrEqual(TEXT_AA)
      expect(contrastRatio(ink, token(tokens, 'accent-hover'))).toBeGreaterThanOrEqual(TEXT_AA)
    })
  })

  it.each(['bg', 'surface-1', 'surface-2'])('control border on %s ≥ 3:1', (surface) => {
    expect(
      contrastRatio(token(base, 'border-strong'), token(base, surface)),
    ).toBeGreaterThanOrEqual(NON_TEXT_AA)
  })

  it.each(['chart-1', 'chart-2', 'chart-3'])('chart color %s on surface-1 ≥ 3:1', (chart) => {
    expect(contrastRatio(token(base, chart), token(base, 'surface-1'))).toBeGreaterThanOrEqual(
      NON_TEXT_AA,
    )
  })
})
