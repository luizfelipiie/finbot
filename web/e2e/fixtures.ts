import AxeBuilder from '@axe-core/playwright'
import { test as base, expect, type Page } from '@playwright/test'

/** Oct 19 2026, 22:30 in Brasília: a month in progress, evening greeting, after 21h (bug C-02). */
export const FIXED_NOW = new Date('2026-10-20T01:30:00Z')

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.clock.setFixedTime(FIXED_NOW)
    await use(page)
  },
})

export { expect }

/** Fails on serious or critical WCAG 2.2 A/AA violations. */
export async function expectNoA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze()
  const relevant = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  )
  expect(
    relevant.map(
      (v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`,
    ),
  ).toEqual([])
}

export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
}
