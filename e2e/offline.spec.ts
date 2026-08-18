import { expect, test } from '@playwright/test'

/**
 * The service worker, actually exercised.
 *
 * Every other spec blocks workers so a stale precache cannot shadow a fresh
 * build. This one allows them, because the worker is the subject: whether the
 * shell precaches, whether species data and sprites land in the cache-first
 * routes, whether that cache is kept long enough to be worth having, and
 * whether a cold start with the network cut still renders a dex.
 *
 * Serial and single-worker: a registration is per-origin, so parallel tests
 * would be claiming and unregistering the same worker underneath each other.
 */
test.describe.configure({ mode: 'serial' })

/** Waits for the worker to be active and controlling this page. */
async function serviceWorkerReady(page: import('@playwright/test').Page) {
  await page.waitForFunction(async () => {
    const registration = await navigator.serviceWorker.getRegistration()
    return Boolean(registration?.active) && Boolean(navigator.serviceWorker.controller)
  }, undefined, { timeout: 30_000 })
}

test.beforeEach(async ({ context }) => {
  // Start from nothing, or the previous test's caches decide the result.
  await context.clearCookies()
})

test('registers a worker and precaches the app shell', async ({ page }) => {
  await page.goto('/kanata')
  await serviceWorkerReady(page)

  /**
   * Polled, not read once. A worker becomes active as soon as its install
   * handler resolves, but Workbox writes precache entries during that install
   * — so a single read can land mid-population and report a half-filled cache.
   * This asks the same question until it settles.
   */
  const precachedUrls = async () =>
    page.evaluate(async () => {
      const names = await window.caches.keys()
      const urls: string[] = []
      for (const name of names.filter((n) => n.includes('precache'))) {
        const cache = await window.caches.open(name)
        urls.push(...(await cache.keys()).map((r) => r.url))
      }
      return urls
    })

  /*
   * The whole set is polled, not just the first entry. Precaching writes many
   * files and finishes at its own pace; asserting the rest with a single read
   * after one of them arrives passes on an idle machine and fails when the
   * other Playwright projects are loading the same server — which is exactly
   * how it failed the first time it ran inside `npm run verify`.
   *
   * Every lazy route chunk is required, not only the entry: without them
   * "works offline" would be true of the menu and nothing else.
   */
  const REQUIRED = [
    /\/assets\/index-.*\.js/,
    /\/assets\/index-.*\.css/,
    /index\.html/,
    /PokemonPage/,
    /SettingsScreen/,
    /RegionInfo/,
    /AreaScreen/,
    /DexToolbar/,
    /explained/,
  ]

  await expect
    .poll(
      async () => {
        const urls = await precachedUrls()
        return REQUIRED.filter((pattern) => !urls.some((u) => pattern.test(u))).map(String)
      },
      { timeout: 30_000, message: 'these never reached the precache' },
    )
    .toEqual([])
})

test('keeps species data and sprites in their own long-lived caches', async ({ page }) => {
  await page.goto('/kanata/pokemon')
  await serviceWorkerReady(page)
  // Let a few cards actually resolve, which is what populates the runtime routes.
  await expect(page.locator('.dex-card__sprite').first()).toBeVisible({ timeout: 30_000 })
  await page.waitForTimeout(3000)

  const stored = await page.evaluate(async () => {
    const names = await window.caches.keys()
    const counts: Record<string, number> = {}
    for (const name of names) {
      const cache = await window.caches.open(name)
      counts[name] = (await cache.keys()).length
    }
    return counts
  })

  const api = Object.entries(stored).find(([name]) => name.includes('pokeapi'))
  const sprites = Object.entries(stored).find(([name]) => name.includes('poke-sprites'))

  expect(api, `no pokeapi cache. caches: ${Object.keys(stored).join(', ')}`).toBeDefined()
  expect(api?.[1]).toBeGreaterThan(0)
  expect(sprites, `no sprite cache. caches: ${Object.keys(stored).join(', ')}`).toBeDefined()
  expect(sprites?.[1]).toBeGreaterThan(0)
})

test('serves a cached entry with the network cut', async ({ page, context }) => {
  await page.goto('/kanata/pokemon/bidoof')
  await serviceWorkerReady(page)
  await expect(page.locator('.monpage__title')).toBeVisible({ timeout: 30_000 })
  // The stat bars only render once the species record has arrived and been cached.
  await expect(page.locator('.stats__bar').first()).toBeVisible({ timeout: 30_000 })

  const nameOnline = await page.locator('.monpage__title').textContent()

  await context.setOffline(true)
  await page.reload()

  // A cold start with no network: the shell comes from the precache and the
  // species record from the cache-first route.
  await expect(page.locator('.monpage__title')).toBeVisible({ timeout: 30_000 })
  expect(await page.locator('.monpage__title').textContent()).toBe(nameOnline)
  await expect(page.locator('.stats__bar').first()).toBeVisible()

  await context.setOffline(false)
})

test('navigateFallback serves a deep link offline', async ({ page, context }) => {
  // Register from one route...
  await page.goto('/kanata')
  await serviceWorkerReady(page)
  await page.waitForTimeout(1500)

  // ...then ask for a different one with the network gone. There is no
  // /kanata/region file on disk; this only works if navigateFallback is wired.
  await context.setOffline(true)
  await page.goto('/kanata/region')
  await expect(page.locator('.page__title')).toBeVisible({ timeout: 30_000 })

  await context.setOffline(false)
})

test('the offline indicator reports the real connection state', async ({ page, context }) => {
  await page.goto('/kanata/settings')
  await serviceWorkerReady(page)
  await expect(page.locator('.setting__status')).toHaveAttribute('data-online', 'true')

  await context.setOffline(true)
  await expect(page.locator('.setting__status')).toHaveAttribute('data-online', 'false')
  await expect(page.locator('.setting__status')).toContainText('Offline')

  await context.setOffline(false)
  await expect(page.locator('.setting__status')).toHaveAttribute('data-online', 'true')
})
