// @vitest-environment node
import { readFileSync } from 'node:fs'

/** Guards the proxy and security headers in vercel.json (ADR 0012); a typo here ships silently. */
interface Transform {
  type: string
  op: string
  target: { key: string }
  args: string
  env: string[]
}
interface VercelConfig {
  routes: { src: string; dest: string; env: string[]; transforms: Transform[] }[]
  rewrites: { source: string; destination: string }[]
  headers: { source: string; headers: { key: string; value: string }[] }[]
}

const config = JSON.parse(
  readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8'),
) as VercelConfig

const apiRoute = config.routes.find((route) => route.src === '/api/(.*)')
const siteHeaders = new Map(
  config.headers
    .find((rule) => rule.source === '/(.*)')
    ?.headers.map((h): [string, string] => [h.key, h.value]),
)
const csp = new Map(
  (siteHeaders.get('Content-Security-Policy') ?? '')
    .split(';')
    .map((directive) => directive.trim().split(/\s+/))
    .map(([name = '', ...values]): [string, string[]] => [name, values]),
)

describe('vercel.json', () => {
  it('proxies /api to the origin taken from the environment', () => {
    expect(apiRoute?.dest).toBe('${API_ORIGIN}/api/$1')
    expect(apiRoute?.env).toEqual(['API_ORIGIN'])
  })

  it('overwrites x-origin-secret with the secret, so a visitor cannot supply their own', () => {
    expect(apiRoute?.transforms).toContainEqual({
      type: 'request.headers',
      op: 'set',
      target: { key: 'x-origin-secret' },
      args: '${ORIGIN_SECRET}',
      env: ['ORIGIN_SECRET'],
    })
  })

  it('turns off CDN caching of API responses', () => {
    const apiHeaders = config.headers.find((rule) => rule.source === '/api/(.*)')?.headers
    expect(apiHeaders).toContainEqual({ key: 'x-vercel-enable-rewrite-caching', value: '0' })
  })

  it('keeps /api out of the single-page app fallback', () => {
    const fallback = new RegExp(`^${config.rewrites[0]?.source ?? ''}$`)
    expect(fallback.test('/api/health')).toBe(false)
    expect(fallback.test('/transacoes')).toBe(true)
  })

  it('sends a CSP that only allows same-origin scripts and connections', () => {
    expect(csp.get('script-src')).toEqual(["'self'"])
    expect(csp.get('connect-src')).toEqual(["'self'"])
    expect(csp.get('frame-ancestors')).toEqual(["'none'"])
    expect(csp.get('object-src')).toEqual(["'none'"])
  })
})
