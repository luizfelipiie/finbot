// Fails when a color literal appears in src/ outside the tokens file.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../src', import.meta.url))
const ALLOWED = new Set(['styles/tokens.css'])
const COLOR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\(/g

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) yield* files(path)
    else if (/\.(tsx?|css)$/.test(name)) yield path
  }
}

const problems = []
for (const file of files(ROOT)) {
  const rel = relative(ROOT, file).split(sep).join('/')
  if (ALLOWED.has(rel) || rel.endsWith('.test.ts') || rel.endsWith('.test.tsx')) continue
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      for (const match of line.matchAll(COLOR)) problems.push(`src/${rel}:${i + 1}  ${match[0]}`)
    })
}

if (problems.length > 0) {
  console.error('Color literals outside src/styles/tokens.css (use tokens):')
  for (const p of problems) console.error(`  ${p}`)
  process.exit(1)
}
console.log('check-hardcoded-colors: ok')
