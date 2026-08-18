/**
 * Core Web Vitals under real interaction, on an emulated mid-range phone.
 *
 * This exists because Lighthouse, for all its virtues, cannot measure the one
 * metric that matters most for an app like this. Lighthouse runs a lab load
 * and reports Total Blocking Time as a *proxy* for responsiveness — nobody
 * clicks anything. INP, which replaced FID as a Core Web Vital, is defined by
 * actual interactions, so it can only be measured by actually interacting.
 *
 * Three other things this does that a plain Lighthouse run does not:
 *
 *   - covers every route, not the two worth hand-picking
 *   - drives the interactions a reader really performs — opening the menu,
 *     scrolling a 158-entry grid, opening an entry, working the D-pad
 *   - throttles CPU 4x and the network to Slow 4G, because the device this
 *     app imitates is not the machine it was built on
 *
 * It asserts against Google's own "good" thresholds and exits non-zero, so it
 * is a gate rather than a dashboard.
 *
 * Run with: npm run vitals
 */
import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { chromium, type Page } from '@playwright/test'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const PORT = 4179
const ORIGIN = `http://localhost:${PORT}`

/** Google's "good" thresholds. LCP and INP in ms, CLS unitless. */
const GOOD = { LCP: 2500, INP: 200, CLS: 0.1, TTFB: 800 } as const

interface Vitals {
  LCP?: number
  INP?: number
  CLS?: number
  TTFB?: number
}

/**
 * Each route with the interactions that actually exercise it. Returning
 * without interacting would leave INP undefined, which reads as a pass and
 * measures nothing.
 */
const ROUTES: [name: string, path: string, drive: (page: Page) => Promise<void>][] = [
  [
    'menu',
    '/kanata',
    async (page) => {
      await page.locator('.tile').first().click()
      await page.waitForTimeout(400)
      await page.goBack()
    },
  ],
  [
    'dex list',
    '/kanata/pokemon',
    async (page) => {
      // The heaviest screen: 158 cards, each with a sprite.
      await page.locator('.screen').evaluate((el) => el.scrollTo(0, el.scrollHeight))
      await page.waitForTimeout(300)
      await page.locator('.page__bar-end').click()
      await page.waitForTimeout(200)
      await page.locator('.type-chip').first().click()
    },
  ],
  [
    'entry',
    '/kanata/pokemon/bidoof',
    async (page) => {
      await page.locator('.btn--sm').first().click()
      await page.waitForTimeout(400)
    },
  ],
  [
    'region',
    '/kanata/region',
    async (page) => {
      await page.locator('.area__button').first().click()
      await page.waitForTimeout(400)
    },
  ],
  [
    'settings',
    '/kanata/settings',
    async (page) => {
      // The label, not the input. The checkbox itself is visually hidden, so a
      // click on it is not an interaction the browser attributes to INP —
      // which is exactly what this harness caught the first time it ran.
      await page.locator('.switch').first().click()
      await page.waitForTimeout(300)
      await page.locator('.btn').first().click()
    },
  ],
  [
    'explained',
    '/explained/kanata/pokemon',
    async (page) => {
      await page.locator('.dex-card__button').first().click()
      await page.waitForTimeout(500)
    },
  ],
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

const library = await readFile(
  resolve(root, 'node_modules', 'web-vitals', 'dist', 'web-vitals.iife.js'),
  'utf8',
)

let browser: import('@playwright/test').Browser | undefined
const rows: [string, Vitals][] = []

try {
  await waitForServer(ORIGIN)
  browser = await chromium.launch()

  for (const [name, path, drive] of ROUTES) {
    const context = await browser.newContext({
      viewport: { width: 412, height: 915 },
      deviceScaleFactor: 2.625,
      isMobile: true,
      hasTouch: true,
    })
    const page = await context.newPage()

    // The library has to be installed before any app code runs, or the
    // paint entries it needs have already been discarded.
    await page.addInitScript(`${library}
      window.__vitals = {}
      webVitals.onLCP((m) => { window.__vitals.LCP = m.value }, { reportAllChanges: true })
      webVitals.onCLS((m) => { window.__vitals.CLS = m.value }, { reportAllChanges: true })
      webVitals.onINP((m) => { window.__vitals.INP = m.value }, { reportAllChanges: true })
      webVitals.onTTFB((m) => { window.__vitals.TTFB = m.value })
    `)

    const cdp = await context.newCDPSession(page)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    await cdp.send('Network.enable')
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 150,
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
    })

    await page.goto(`${ORIGIN}${path}`, { waitUntil: 'load' })
    await page.waitForTimeout(1200)
    try {
      await drive(page)
    } catch {
      // A route that changed shape should not abort the whole run; the missing
      // INP below is the signal.
    }
    await page.waitForTimeout(600)

    rows.push([name, await page.evaluate(() => window.__vitals as Vitals)])
    await context.close()
  }
} finally {
  await browser?.close()
  preview.kill()
}

const fmt = (v: number | undefined, digits = 0) => (v === undefined ? '   —' : v.toFixed(digits))
const mark = (v: number | undefined, limit: number) =>
  v === undefined ? ' ?' : v <= limit ? ' ok' : ' !!'

console.log('\n  Core Web Vitals — 4x CPU throttle, Slow 4G, 412x915 mobile\n')
console.log('  route        LCP ms      INP ms       CLS     TTFB ms')
console.log('  ' + '-'.repeat(52))

const failures: string[] = []
for (const [name, v] of rows) {
  console.log(
    `  ${name.padEnd(11)} ${fmt(v.LCP).padStart(6)}${mark(v.LCP, GOOD.LCP)}` +
      ` ${fmt(v.INP).padStart(7)}${mark(v.INP, GOOD.INP)}` +
      ` ${fmt(v.CLS, 3).padStart(8)}${mark(v.CLS, GOOD.CLS)}` +
      ` ${fmt(v.TTFB).padStart(7)}${mark(v.TTFB, GOOD.TTFB)}`,
  )
  for (const [metric, limit] of Object.entries(GOOD)) {
    const value = v[metric as keyof Vitals]
    if (value !== undefined && value > limit) {
      failures.push(`${name}: ${metric} ${value.toFixed(metric === 'CLS' ? 3 : 0)} > ${limit}`)
    }
  }
  if (v.INP === undefined) failures.push(`${name}: no INP recorded — did the interaction run?`)
}

console.log(`\n  thresholds: LCP ${GOOD.LCP}  INP ${GOOD.INP}  CLS ${GOOD.CLS}  TTFB ${GOOD.TTFB}\n`)

if (failures.length) {
  console.error(`  BELOW THRESHOLD\n    ${failures.join('\n    ')}\n`)
  process.exit(1)
}
console.log('  every route within Google’s "good" thresholds.\n')
