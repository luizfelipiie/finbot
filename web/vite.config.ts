/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

interface VercelConfig {
  headers: { source: string; headers: { key: string; value: string }[] }[]
}

/** The production security headers (CSP included), so `vite preview` and E2E run under them. */
function productionHeaders(): Record<string, string> {
  const config = JSON.parse(
    readFileSync(new URL('./vercel.json', import.meta.url), 'utf8'),
  ) as VercelConfig
  const site = config.headers.find((rule) => rule.source === '/(.*)')
  if (!site) throw new Error('vercel.json has no headers rule for /(.*)')
  return Object.fromEntries(site.headers.map(({ key, value }) => [key, value]))
}

/** Not a secret: matches api/src/main/resources/application-local.properties. */
const LOCAL_ORIGIN_SECRET = 'local-dev-origin-secret-not-for-production'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        headers: { 'x-origin-secret': LOCAL_ORIGIN_SECRET },
      },
    },
  },
  preview: { headers: productionHeaders() },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
