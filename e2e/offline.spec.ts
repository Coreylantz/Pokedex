import { expect, test } from '@playwright/test'

/**
 * Every other spec blocks service workers so a stale precache cannot shadow a
 * fresh build; here the worker is the subject, so they are allowed.
 *
 * Serial and single-worker: a registration is per-origin, so parallel tests
 * would claim and unregister the same worker underneath each other.
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
   * Polled: a worker goes active as soon as install resolves, but Workbox
   * writes precache entries during it, so one read can catch a half-filled cache.
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
   * The whole set is polled, not just the first entry: reading the rest once
   * one arrives passes on an idle machine and fails under a loaded runner.
   *
   * Every lazy route chunk is required, or "works offline" would be true of the
   * menu and nothing else.
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

  const cacheCounts = async () =>
    page.evaluate(async () => {
      const counts: Record<string, number> = {}
      for (const name of await window.caches.keys()) {
        counts[name] = (await window.caches.open(name).then((c) => c.keys())).length
      }
      return counts
    })

  // Polled rather than slept on: a fixed wait passed locally and failed on a
  // loaded runner, which measures the runner rather than the app.
  await expect
    .poll(
      async () => {
        const counts = await cacheCounts()
        return Object.entries(counts)
          .filter(([name]) => name.includes('pokeapi') || name.includes('poke-sprites'))
          .filter(([, n]) => n > 0)
          .map(([name]) => name.replace(/-v2$/, ''))
          .sort()
      },
      {
        timeout: 60_000,
        message: 'species data and sprites never reached their runtime caches',
      },
    )
    .toEqual(['poke-sprites', 'pokeapi'])
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

  // ...then ask for a different one offline. There is no /kanata/region file on
  // disk, so this only passes if navigateFallback is wired.
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
