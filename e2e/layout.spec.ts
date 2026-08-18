import { expect, test } from '@playwright/test'
import { box, stubPokeApi } from './fixtures/pokeapi'

/**
 * Layout at the shapes that actually break: a phone, a short landscape window,
 * and a desktop where the device must stay a handheld rather than stretching
 * into a web page.
 */
test('the device stays a handheld on a wide desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 })
  await page.goto('/kanata')
  const device = await box(page.locator('.device'))
  // Narrow and tall, not a full-width panel.
  expect(device.width).toBeLessThan(560)
  expect(device.height).toBeGreaterThan(device.width)
})

test('landscape puts the chrome down the sides', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 420 })
  await page.goto('/kanata/pokemon')

  const [top, screen, controls] = await Promise.all([
    box(page.locator('.device__top')),
    box(page.locator('.screen')),
    box(page.locator('.device__controls')),
  ])

  // Side by side rather than stacked: the screen sits between the two rails.
  expect(top.x + top.width).toBeLessThanOrEqual(screen.x + 1)
  expect(controls.x).toBeGreaterThanOrEqual(screen.x + screen.width - 1)

  // And the unit still fits the window, with no scrollbar.
  const m = await page.evaluate(() => ({
    gutter: window.innerWidth - document.documentElement.clientWidth,
    bottom: document.querySelector('.device')!.getBoundingClientRect().bottom,
    viewport: window.innerHeight,
  }))
  expect(m.gutter).toBe(0)
  expect(m.bottom).toBeLessThanOrEqual(m.viewport + 1)
})

test('a phone gets the full screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 })
  await page.goto('/kanata')
  const device = await box(page.locator('.device'))
  expect(device.width).toBeGreaterThanOrEqual(388)
})

test('sprites render at a whole multiple so the pixel art stays square', async ({ page }) => {
  await stubPokeApi(page)
  await page.goto('/kanata/pokemon')
  const sprite = page.locator('.dex-card__sprite').first()
  await expect(sprite).toBeVisible()
  const rect = await box(sprite)
  // 96 or 192 — anything between drops pixel rows under nearest-neighbour.
  expect([96, 192]).toContain(Math.round(rect.width))
})
