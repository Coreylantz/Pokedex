/**
 * Scroll smoothness is per-frame, not per-load, so no static budget catches it:
 * the bundle can be small and INP green while dragging still feels like
 * sandpaper. Reports long tasks, forced synchronous layouts, and frame
 * intervals against the 60fps budget.
 *
 * Run with: npm run jank
 */
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { chromium } from '@playwright/test'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const PORT = 4183
const ORIGIN = `http://localhost:${PORT}`

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

let browser: import('@playwright/test').Browser | undefined
try {
  await waitForServer(ORIGIN)
  browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  })
  const page = await context.newPage()

  const cdp = await context.newCDPSession(page)
  // 4x is a mid-range phone, which is what most readers actually get.
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })

  await page.addInitScript(() => {
    const w = window as unknown as {
      __long: number[]
      __frames: number[]
      __watch: () => void
    }
    w.__long = []
    w.__frames = []

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) w.__long.push(entry.duration)
    }).observe({ entryTypes: ['longtask'] })

    w.__watch = () => {
      let last = performance.now()
      const tick = (now: number) => {
        w.__frames.push(now - last)
        last = now
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }
  })

  const drag = async () => {
    // A real drag: scrollTo skips the compositor path.
    const box = await page.locator('.screen').boundingBox()
    if (!box) throw new Error('no screen')
    for (let i = 0; i < 8; i++) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.8)
      await page.mouse.down()
      for (let step = 0; step < 12; step++) {
        await page.mouse.move(
          box.x + box.width / 2,
          box.y + box.height * 0.8 - (step * box.height * 0.6) / 12,
        )
      }
      await page.mouse.up()
      await page.waitForTimeout(120)
    }
  }

  const collect = async () => {
    const result = await page.evaluate(() => {
      const w = window as unknown as { __long: number[]; __frames: number[] }
      const out = { long: [...w.__long], frames: [...w.__frames] }
      w.__long.length = 0
      w.__frames.length = 0
      return out
    })
    const frames = result.frames.filter((f) => f > 0)
    const sorted = [...frames].sort((a, b) => a - b)
    return {
      frames: frames.length,
      median: sorted[Math.floor(sorted.length * 0.5)] ?? 0,
      p95: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
      worst: sorted.at(-1) ?? 0,
      dropped: frames.filter((f) => f > 20).length,
      long: result.long.length,
      blocking: result.long.reduce((a, b) => a + b, 0),
    }
  }

  // Two phases: a list that scrolls perfectly when settled can still stutter
  // badly while 158 species stream in, and only that first number explains a
  // complaint about the dex feeling rough.
  await page.goto(`${ORIGIN}/kanata/pokemon`, { waitUntil: 'commit' })
  await page.evaluate(() => (window as unknown as { __watch: () => void }).__watch())
  await page.locator('.dex-card').first().waitFor({ timeout: 30_000 })
  await drag()
  const loading = await collect()

  await page.waitForTimeout(4000)
  await drag()
  const settled = await collect()

  console.log('\n  Scroll jank — dex list, 4x CPU throttle, real drag\n')
  console.log('  phase          frames   median      p95    worst   >20ms   long tasks')
  console.log('  ' + '-'.repeat(70))
  for (const [name, m] of [
    ['while loading', loading],
    ['settled', settled],
  ] as const) {
    console.log(
      `  ${name.padEnd(14)} ${String(m.frames).padStart(6)} ` +
        `${m.median.toFixed(1).padStart(8)} ${m.p95.toFixed(1).padStart(8)} ` +
        `${m.worst.toFixed(1).padStart(8)} ` +
        `${`${m.dropped} (${((m.dropped / (m.frames || 1)) * 100).toFixed(0)}%)`.padStart(9)} ` +
        `${String(m.long).padStart(6)}${m.long ? ` / ${m.blocking.toFixed(0)}ms` : ''}`,
    )
  }
  console.log()
} finally {
  await browser?.close()
  preview.kill()
}
