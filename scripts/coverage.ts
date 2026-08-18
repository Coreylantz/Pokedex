/**
 * How much of the shipped JavaScript and CSS actually runs.
 *
 * Tree shaking is a build-time question: did the bundler drop code nothing
 * imports? Coverage is the runtime one: of the code that did ship, how much
 * executes? A perfectly tree-shaken bundle can still be 60% unused on first
 * paint, and the fix for that is code splitting rather than shaking.
 *
 * Measured twice per route, because the two numbers mean different things:
 *
 *   - on load:  what a first paint paid for but did not use
 *   - after use: what remains unused once the screen has been driven, which is
 *     the code that is genuinely dead weight for that route
 *
 * Run with: npm run coverage
 */
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { chromium, type Page } from '@playwright/test'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const PORT = 4182
const ORIGIN = `http://localhost:${PORT}`

const ROUTES: [name: string, path: string, drive: (page: Page) => Promise<void>][] = [
  ['menu', '/kanata', async () => {}],
  [
    'dex list',
    '/kanata/pokemon',
    async (page) => {
      await page.locator('.screen').evaluate((el) => el.scrollTo(0, el.scrollHeight))
      await page.locator('.page__bar-end').click()
      await page.waitForTimeout(300)
    },
  ],
  ['entry', '/kanata/pokemon/bidoof', async () => {}],
  ['settings', '/kanata/settings', async () => {}],
]

async function waitForServer(url: string, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      if ((await fetch(url)).ok) return
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

interface Tally {
  total: number
  used: number
}

/** Merges overlapping intervals so nested V8 ranges are not counted twice. */
function merged(ranges: { start: number; end: number }[]): number {
  const sorted = [...ranges].sort((a, b) => a.start - b.start)
  let used = 0
  let cursor = -1
  for (const { start, end } of sorted) {
    const from = Math.max(start, cursor)
    if (end > from) {
      used += end - from
      cursor = end
    }
  }
  return used
}

/**
 * V8 reports JS coverage as nested function ranges with execution counts; CSS
 * comes back as a flat list of used ranges. Two shapes, one measure.
 */
interface JsEntry {
  url: string
  source?: string
  functions: { ranges: { startOffset: number; endOffset: number; count: number }[] }[]
}
interface CssEntry {
  url: string
  text?: string
  ranges: { start: number; end: number }[]
}

/**
 * Counts the *uncovered* ranges, not the covered ones.
 *
 * V8 nests coverage: the outermost range of a module spans the entire file and
 * has a non-zero count as soon as the module is evaluated, with unexecuted
 * functions appearing as zero-count holes inside it. Summing covered ranges
 * therefore reports ~100% for any file that loaded at all — which is exactly
 * the wrong answer, and what this script printed on its first run. Chrome
 * DevTools measures the holes and subtracts, so this does too.
 */
const tallyJs = (entries: JsEntry[]): Tally =>
  entries.reduce(
    (acc, entry) => {
      // Vite's own preview assets only; ignore anything cross-origin.
      if (!entry.url.startsWith(ORIGIN)) return acc
      const total = entry.source?.length ?? 0
      const holes = entry.functions.flatMap((fn) =>
        fn.ranges
          .filter((r) => r.count === 0)
          .map((r) => ({ start: r.startOffset, end: r.endOffset })),
      )
      acc.total += total
      acc.used += total - merged(holes)
      return acc
    },
    { total: 0, used: 0 },
  )

const tallyCss = (entries: CssEntry[]): Tally =>
  entries.reduce(
    (acc, entry) => {
      if (!entry.url.startsWith(ORIGIN)) return acc
      acc.total += entry.text?.length ?? 0
      acc.used += merged(entry.ranges)
      return acc
    },
    { total: 0, used: 0 },
  )

let browser: import('@playwright/test').Browser | undefined
const rows: [string, Tally, Tally, Tally][] = []

try {
  await waitForServer(ORIGIN)
  browser = await chromium.launch()

  /**
   * Each figure comes from its own page load. Restarting coverage on a live
   * page does not give a clean baseline — the scripts are already evaluated,
   * so the second measurement reports nearly everything as covered regardless
   * of what the interaction touched.
   */
  const measure = async (path: string, drive?: (page: Page) => Promise<void>) => {
    const page = await browser!.newPage()
    await page.coverage.startJSCoverage({ resetOnNavigation: false })
    await page.coverage.startCSSCoverage({ resetOnNavigation: false })

    await page.goto(`${ORIGIN}${path}`, { waitUntil: 'load' })
    await page.waitForTimeout(1500)
    if (drive) {
      try {
        await drive(page)
      } catch {
        // A route that changed shape should not abort the whole run.
      }
      await page.waitForTimeout(500)
    }

    const js = tallyJs(await page.coverage.stopJSCoverage())
    const css = tallyCss(await page.coverage.stopCSSCoverage())
    await page.close()
    return { js, css }
  }

  for (const [name, path, drive] of ROUTES) {
    const onLoad = await measure(path)
    const used = await measure(path, drive)
    rows.push([name, onLoad.js, used.js, used.css])
  }
} finally {
  await browser?.close()
  preview.kill()
}

const pct = (t: Tally) => (t.total ? (t.used / t.total) * 100 : 0)
const fmt = (t: Tally) => `${pct(t).toFixed(0)}%`.padStart(6)
const kbUnused = (t: Tally) => `${((t.total - t.used) / 1024).toFixed(0)} kB`.padStart(8)

console.log('\n  Code coverage — how much of what shipped actually runs\n')
console.log('  route         JS on load   unused    JS in use    CSS used   unused')
console.log('  ' + '-'.repeat(68))
for (const [name, onLoad, afterUse, css] of rows) {
  console.log(
    `  ${name.padEnd(12)} ${fmt(onLoad)} ${kbUnused(onLoad)}   ${fmt(afterUse)}      ${fmt(css)} ${kbUnused(css)}`,
  )
}
console.log(
  '\n  "JS on load" counts every byte parsed before first paint. The rest is\n' +
    '  React paths this route never takes — unreachable by splitting, since it\n' +
    '  is inside the framework rather than in a module of ours.\n',
)
