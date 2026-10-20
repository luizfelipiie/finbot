// Captures the phase report screenshots: Início in 390px and 1280px for each accent option,
// plus the design system page. Run `npm run prints` (builds and serves the app itself).
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const OUT = fileURLToPath(new URL('../../docs/fases/fase-1/', import.meta.url))
const PORT = 4174
const BASE = `http://127.0.0.1:${PORT}`
const NOW = new Date('2026-10-20T01:30:00Z') // Oct 19, 22:30 in Brasília

// A single command string: the shell is needed to resolve npx on Windows.
const server = spawn(`npx vite preview --host 127.0.0.1 --port ${PORT} --strictPort`, {
  shell: true,
  stdio: 'ignore',
})

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(BASE)).ok) return
    } catch {
      // Not up yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error('Preview server did not start')
}

const shots = [
  ...['ambar', 'quente', 'lima'].flatMap((accent) => [
    { name: `inicio-390-${accent}`, path: `/?accent=${accent}`, width: 390 },
    { name: `inicio-1280-${accent}`, path: `/?accent=${accent}`, width: 1280 },
  ]),
  { name: 'inicio-390-estouro', path: '/?scenario=overflow', width: 390 },
  { name: 'inicio-390-sem-receita', path: '/?scenario=no-income', width: 390 },
  { name: 'design-system-1280', path: '/design-system', width: 1280 },
  { name: 'design-system-390', path: '/design-system', width: 390 },
]

try {
  mkdirSync(OUT, { recursive: true })
  await waitForServer()
  const browser = await chromium.launch()
  for (const shot of shots) {
    const context = await browser.newContext({
      viewport: { width: shot.width, height: 800 },
      deviceScaleFactor: 2,
      locale: 'pt-BR',
      timezoneId: 'America/Sao_Paulo',
    })
    const page = await context.newPage()
    await page.clock.setFixedTime(NOW)
    await page.goto(BASE + shot.path)
    await page.evaluate(() => document.fonts.ready)
    // Grow the viewport to the page height so the fixed bottom bar lands at the bottom.
    const height = await page.evaluate(() => document.documentElement.scrollHeight)
    await page.setViewportSize({ width: shot.width, height })
    await page.screenshot({ path: `${OUT}${shot.name}.png` })
    await context.close()
    console.log(`saved ${shot.name}.png`)
  }
  await browser.close()
} finally {
  server.kill()
}
