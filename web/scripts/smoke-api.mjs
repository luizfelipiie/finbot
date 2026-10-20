// Checks the deployed proxy end to end (ADR 0012):
//   npm run smoke -- https://finbot-ochre.vercel.app https://finbot-api.onrender.com
// The first call may wake the free instance, which takes up to about a minute.

const [appUrl, apiUrl] = process.argv.slice(2)
if (!appUrl || !apiUrl) {
  console.error('Usage: npm run smoke -- <app url> <direct api url>')
  process.exit(2)
}

const TIMEOUT_MS = 130_000
const failures = []

function check(condition, message) {
  console.log(`${condition ? 'ok  ' : 'FAIL'} ${message}`)
  if (!condition) failures.push(message)
}

async function get(url) {
  const started = performance.now()
  const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  const body = await response.text()
  return { response, body, seconds: formatSeconds(performance.now() - started) }
}

function formatSeconds(ms) {
  return (ms / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })
}

const first = await get(`${apiUrl}/health`)
console.log(`     direct /health answered in ${first.seconds} s (includes waking up)`)
check(first.response.status === 200, `direct /health is 200 (got ${first.response.status})`)

const direct = await get(`${apiUrl}/api/health`)
check(direct.response.status === 403, `direct /api/health is 403 (got ${direct.response.status})`)

for (const attempt of [1, 2]) {
  const proxied = await get(`${appUrl}/api/health`)
  const cacheControl = proxied.response.headers.get('cache-control') ?? ''
  const vercelCache = proxied.response.headers.get('x-vercel-cache') ?? '(absent)'
  console.log(`     proxied call ${attempt} took ${proxied.seconds} s`)
  check(
    proxied.response.status === 200,
    `proxied /api/health is 200 (got ${proxied.response.status})`,
  )
  check(proxied.body.includes('"database":"up"'), 'proxied /api/health reached the database')
  check(cacheControl.includes('no-store'), `Cache-Control has no-store (got "${cacheControl}")`)
  check(
    vercelCache !== 'HIT' && vercelCache !== 'STALE',
    `not served from the CDN cache (x-vercel-cache: ${vercelCache})`,
  )
  check(!proxied.response.headers.has('x-origin-secret'), 'the origin secret is not echoed back')
}

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed`)
  process.exit(1)
}
console.log('\nAll checks passed')
