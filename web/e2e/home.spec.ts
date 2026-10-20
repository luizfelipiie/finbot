import { expect, expectNoA11yViolations, expectNoHorizontalScroll, test } from './fixtures'

test.describe('Início', () => {
  test('shows the dashboard in the user time zone', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1, name: 'Boa noite, Ana' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Saldo em contas' })).toBeVisible()
    // 22:30 in Brasília is already Oct 20 in UTC; the cycle must still be October 1–19.
    await expect(
      page.getByText('1 a 19 de outubro, comparado com 1 a 19 de setembro'),
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Para onde foi sua renda' })).toBeVisible()
    await expect(page.getByText('Protótipo com dados fictícios')).toBeVisible()
  })

  test('has no serious accessibility violations and no horizontal scroll', async ({ page }) => {
    await page.goto('/')
    await expectNoA11yViolations(page)
    await expectNoHorizontalScroll(page)
  })

  test('privacy mode hides every value and is remembered', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Ocultar valores' }).click()
    await expect(page.getByText(/R\$ \d/)).toHaveCount(0)
    await page.reload()
    await expect(page.getByRole('button', { name: 'Mostrar valores' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(page.getByText(/R\$ \d/)).toHaveCount(0)
  })

  test('every slice of the donut drills down to its transactions', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /Gastos variáveis/ }).click()
    const sheet = page.getByRole('dialog', { name: 'Gastos variáveis' })
    await expect(sheet).toBeVisible()
    await expect(sheet.getByText('Supermercado').first()).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(sheet).toBeHidden()

    await page.getByRole('button', { name: /Disponível/ }).click()
    await expect(
      page.getByRole('dialog', { name: 'Disponível' }).getByText('Renda do ciclo'),
    ).toBeVisible()
  })

  test('overflow replaces the donut with the excess', async ({ page }) => {
    await page.goto('/?scenario=overflow')
    await expect(page.getByText(/a mais do que recebeu/)).toBeVisible()
    await expect(page.getByRole('button', { name: /Disponível/ })).toHaveCount(0)
  })

  test('no income shows an empty state instead of the donut', async ({ page }) => {
    await page.goto('/?scenario=no-income')
    await expect(page.getByText('Nenhuma receita registrada em outubro.')).toBeVisible()
  })

  test('loading, error and offline states', async ({ page }) => {
    await page.goto('/?scenario=loading')
    await expect(page.getByRole('status').filter({ hasText: 'Carregando o painel' })).toBeAttached()

    await page.goto('/?scenario=error')
    await expect(page.getByRole('alert')).toContainText('Não foi possível carregar o painel.')
    await page.getByRole('button', { name: 'Tentar de novo' }).click()
    await expect(page.getByRole('heading', { name: 'Saldo em contas' })).toBeVisible()

    await page.goto('/?scenario=offline')
    await expect(
      page.getByRole('status').filter({ hasText: 'Sem conexão. Os valores' }),
    ).toBeVisible()
  })

  test('navigation reaches every destination', async ({ page }) => {
    await page.goto('/')
    const nav = page.getByRole('navigation', { name: 'Principal' })
    for (const name of ['Transações', 'Planejar', 'Carteira']) {
      await nav.getByRole('link', { name }).click()
      await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
    }
    await nav.getByRole('link', { name: 'Início' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Boa noite, Ana' })).toBeVisible()
  })

  test('the + button explains that recording arrives later', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Registrar' }).first().click()
    const sheet = page.getByRole('dialog', { name: 'Registrar' })
    await expect(sheet).toContainText('ainda não são salvos')
    await expectNoA11yViolations(page)
  })
})

test.describe('Design system', () => {
  test('renders every section without accessibility violations', async ({ page }) => {
    await page.goto('/design-system')
    for (const name of [
      'Cores',
      'Tipografia',
      'Botões',
      'Campos',
      'Valores',
      'Estados',
      'Sobreposições',
    ]) {
      await expect(page.getByRole('heading', { level: 2, name })).toBeVisible()
    }
    await expect(page.getByText('Reprovado', { exact: true })).toHaveCount(0)
    await expectNoA11yViolations(page)
    await expectNoHorizontalScroll(page)
  })

  test('contrast holds for each accent option', async ({ page }) => {
    for (const accent of ['ambar', 'quente', 'lima']) {
      await page.goto(`/design-system?accent=${accent}`)
      await expect(page.locator('html')).toHaveAttribute('data-accent', accent)
      await expect(page.getByText('Reprovado', { exact: true })).toHaveCount(0)
    }
  })
})
