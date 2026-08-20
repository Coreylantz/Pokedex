/**
 * The counterpart to `budget.ts`, which only weighs `dist/`: Lighthouse loads
 * the app in Chrome and measures what actually happens.
 *
 * A report, not a gate — it sees one route in one viewport, while the e2e suite
 * runs axe over eleven states at three viewports and fails the build.
 *
 * Run with: npm run audit
 */
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import lighthouse from 'lighthouse'
import { chromium } from '@playwright/test'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const PORT = 4178
const ORIGIN = `http://localhost:${PORT}`

const ROUTES = [
  ['menu', '/kanata'],
  ['dex', '/kanata/pokemon'],
] as const

async function waitForServer(url: string, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      // Not up yet.
    }
    await new Promise((r) => setTimeout(r, 300))
  }
  throw new Error(`preview server never came up at ${url}`)
}

const preview = spawn(
  process.platform === 'win32' ? 'npm.cmd' : 'npm',
  ['run', 'preview', '--', '--port', String(PORT), '--strictPort'],
  { cwd: root, stdio: 'ignore', shell: process.platform === 'win32' },
)

// Chrome comes from Playwright's download; no separate browser needed.
let browser: import('@playwright/test').Browser | undefined
try {
  await waitForServer(ORIGIN)
  browser = await chromium.launch({ args: ['--remote-debugging-port=9222'] })

  await mkdir(resolve(root, 'reports'), { recursive: true })
  const summary: string[] = []

  for (const [name, path] of ROUTES) {
    const result = await lighthouse(
      `${ORIGIN}${path}`,
      { port: 9222, output: ['html', 'json'], logLevel: 'error' },
      undefined,
    )
    if (!result) throw new Error(`lighthouse returned nothing for ${path}`)

    const { lhr, report } = result
    await writeFile(resolve(root, 'reports', `lighthouse-${name}.html`), report[0] ?? '', 'utf8')

    const score = (id: string) => Math.round((lhr.categories[id]?.score ?? 0) * 100)
    const metric = (id: string) => lhr.audits[id]?.displayValue ?? '—'

    summary.push(
      `${name.padEnd(6)} ` +
        `perf ${String(score('performance')).padStart(3)}  ` +
        `a11y ${String(score('accessibility')).padStart(3)}  ` +
        `best ${String(score('best-practices')).padStart(3)}  ` +
        `seo ${String(score('seo')).padStart(3)}   ` +
        `FCP ${metric('first-contentful-paint')}  ` +
        `LCP ${metric('largest-contentful-paint')}  ` +
        `TBT ${metric('total-blocking-time')}  ` +
        `CLS ${metric('cumulative-layout-shift')}`,
    )
    // Cross-checks scripts/coverage.ts, which reads the CDP profiler instead.
    summary.push(
      `       unused JS ${metric('unused-javascript')}  ` +
        `unused CSS ${metric('unused-css-rules')}  ` +
        `legacy polyfills ${metric('legacy-javascript')}`,
    )

    const a11y = Object.values(lhr.audits).filter(
      (a) => a.score === 0 && lhr.categories.accessibility?.auditRefs.some((r) => r.id === a.id),
    )
    for (const audit of a11y) {
      // Weight 0 is reported but does not move the score, so say which —
      // otherwise a "100" beside a listed failure looks like a lie.
      const weight =
        lhr.categories.accessibility?.auditRefs.find((r) => r.id === audit.id)?.weight ?? 0
      const items = (audit.details as { items?: { node?: { selector?: string } }[] } | undefined)
        ?.items?.slice(0, 3)
        .map((i) => i.node?.selector ?? '?')
        .join(' | ')
      summary.push(
        `       ${audit.id} (weight ${weight})${weight === 0 ? ' — not scored' : ''}: ${items ?? ''}`,
      )
    }
  }

  console.log(`\n${summary.join('\n')}\n`)
  console.log(`  full reports: reports/lighthouse-*.html\n`)
} finally {
  await browser?.close()
  preview.kill()
}
