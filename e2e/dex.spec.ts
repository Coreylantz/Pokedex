import { expect, test, type Page } from '@playwright/test'
import { box, stubPokeApi } from './fixtures/pokeapi'

/**
 * These cover the things jsdom structurally cannot: real layout, real
 * scrolling, real focus behaviour and the actual built stylesheet.
 */
test.beforeEach(async ({ page }) => {
  await stubPokeApi(page)
})

test('boots to the menu', async ({ page }) => {
  await page.goto('/kanata')
  await expect(page.locator('.menu__title')).toHaveText('Kanata')
  await expect(page.locator('.tile__label')).toHaveText(['Pokémon', 'Region', 'Settings'])
})

test('the menu is a two-column grid', async ({ page }) => {
  await page.goto('/kanata')
  const columns = await page
    .locator('.menu__grid')
    .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length)
  expect(columns).toBe(2)
})

/**
 * The window must never gain a scrollbar — the display scrolls instead.
 * Measured as the gutter the browser reserves, not as content extent: content
 * inside a scrolling element legitimately extends past the viewport.
 */
async function windowScrollbar(page: Page) {
  return page.evaluate(() => ({
    gutter: window.innerWidth - document.documentElement.clientWidth,
    screenScrolls: (() => {
      const s = document.querySelector('.screen')!
      return s.scrollHeight > s.clientHeight
    })(),
    deviceFits: document.querySelector('.device')!.getBoundingClientRect().bottom,
    viewport: window.innerHeight,
  }))
}

test('only the screen scrolls — the window never does', async ({ page }) => {
  // Settings is the tallest page, and the one that used to grow the document.
  await page.goto('/kanata/settings')
  await expect(page.locator('.page__title')).toHaveText('Settings')

  const m = await windowScrollbar(page)
  expect(m.gutter).toBe(0)
  expect(m.screenScrolls).toBe(true)
  expect(m.deviceFits).toBeLessThanOrEqual(m.viewport + 1)
})

test('changing a setting does not grow the document', async ({ page }) => {
  await page.goto('/kanata/settings')
  await page.selectOption('.setting__select >> nth=1', 'largest')
  await expect(page.locator('.app')).toHaveAttribute('data-text-size', 'largest')

  const m = await windowScrollbar(page)
  expect(m.gutter).toBe(0)
  expect(m.deviceFits).toBeLessThanOrEqual(m.viewport + 1)
})

test('the dex lists every entry and opens one as a page', async ({ page }) => {
  await page.goto('/kanata/pokemon')
  const cards = page.locator('.dex-card')
  await expect(cards.first()).toBeVisible()
  expect(await cards.count()).toBeGreaterThan(100)

  // A link now, not a button: everything that navigates is one.
  await cards.first().locator('a').click()
  await expect(page).toHaveURL(/\/kanata\/pokemon\/turtwig$/)
  await expect(page.locator('.monpage__title')).toBeVisible()
  // Focus lands on the heading, the way a navigation should leave it.
  await expect(page.locator('.monpage__title')).toBeFocused()
})

test('the D-pad moves focus inside the screen', async ({ page }) => {
  await page.goto('/kanata/pokemon')
  await page.locator('.dex-card__button').first().focus()
  const first = await page.evaluate(() => (document.activeElement as HTMLElement).dataset.slug)

  await page.locator('.dpad__btn--right').click()
  const second = await page.evaluate(() => (document.activeElement as HTMLElement).dataset.slug)

  expect(second).not.toBe(first)
  // Focus must stay on the screen rather than jumping to the button pressed.
  expect(second).toBeTruthy()
})

test('a focused dex card inverts and keeps a transparent outline for forced colours', async ({
  page,
}) => {
  await page.goto('/kanata/pokemon')
  await page.locator('.dex-card__button').first().focus()
  await page.locator('.dpad__btn--right').click()

  const style = await page.evaluate(() => {
    const el = document.activeElement!
    const s = getComputedStyle(el)
    const unfocused = getComputedStyle(document.querySelectorAll('.dex-card__button')[4]!)
    return {
      outlineColor: s.outlineColor,
      outlineWidth: s.outlineWidth,
      background: s.backgroundColor,
      shadow: s.boxShadow,
      otherBackground: unfocused.backgroundColor,
    }
  })
  expect(style.outlineColor).toContain('rgba(0, 0, 0, 0)')
  expect(style.outlineWidth).toBe('3px')
  // The indicator has to be visible, not merely present.
  expect(style.background).not.toBe(style.otherBackground)
  // ...and flat, so the fill reaches the border instead of leaving a gap.
  expect(style.shadow).not.toContain('inset')
})

test('a focused card keeps its contents legible', async ({ page }) => {
  await page.goto('/kanata')
  await page.locator('.tile').first().focus()
  await page.locator('.dpad__btn--right').click()

  const seen = await page.evaluate(() => {
    const tile = document.activeElement!
    const svg = tile.querySelector('svg')!
    const tileBg = getComputedStyle(tile).backgroundColor
    const iconFill = getComputedStyle(svg).fill
    return { tileBg, iconFill, same: tileBg === iconFill }
  })
  // An icon inheriting the inverted colour must not also be filtered, or it
  // inverts twice and disappears into the background.
  expect(seen.same).toBe(false)
})

test('back to top appears only once the list is scrolled to the end', async ({ page }) => {
  await page.goto('/kanata/pokemon')
  await expect(page.locator('.to-top')).toHaveCount(0)

  await page.locator('.screen').evaluate((el) => {
    el.scrollTop = el.scrollHeight
  })
  await expect(page.locator('.to-top')).toBeVisible()

  await page.locator('.to-top').click()
  const top = await page.locator('.screen').evaluate((el) => el.scrollTop)
  expect(top).toBe(0)
})

test('search only filters once submitted', async ({ page }) => {
  await page.goto('/kanata/pokemon')
  const before = await page.locator('.dex-card').count()

  await page.locator('.page__bar-end').click()
  await page.locator('.finder__input').fill('001')
  expect(await page.locator('.dex-card').count()).toBe(before)

  await page.locator('.finder__input').press('Enter')
  expect(await page.locator('.dex-card').count()).toBeLessThan(before)
})

test('turning the shell off leaves the screen edge to edge', async ({ page }) => {
  await page.goto('/kanata/settings')
  // The checkbox itself is visually hidden behind a styled track, so drive it
  // through the label the way a person would.
  await page.locator('.setting', { hasText: 'Device frame' }).locator('.switch').click()

  await expect(page.locator('.app')).toHaveAttribute('data-shell', 'false')
  await expect(page.locator('.device__controls')).toBeHidden()
  // Region switching survives the shell going away.
  await expect(page.locator('.screen__tabs [role="tab"]')).toHaveCount(2)

  const screenBox = await box(page.locator('.screen'))
  const size = page.viewportSize()!
  expect(screenBox.width).toBeGreaterThanOrEqual(size.width - 2)
})

test('icons render at their intended size, not squeezed by their button', async ({ page }) => {
  await page.goto('/kanata/pokemon')
  const m = await page.evaluate(() => {
    const btn = document.querySelector('.page__bar-end')!
    const svg = btn.querySelector('svg')!
    return {
      icon: svg.getBoundingClientRect().width,
      button: btn.getBoundingClientRect().width,
    }
  })
  // 1.5rem in a 2.4rem button. A crushed content box used to clamp this to 8px.
  expect(m.button).toBeGreaterThan(36)
  expect(m.icon).toBeGreaterThan(20)
  expect(m.icon).toBeLessThan(m.button)
})

test('every route sets its own document title', async ({ page }) => {
  const cases: [url: string, pattern: RegExp][] = [
    ['/kanata', /^Kanata — Twin Dex$/],
    ['/kanata/pokemon', /^Kanata Pokédex — Twin Dex$/],
    ['/kanata/region', /^Kanata Region — Twin Dex$/],
    ['/kanata/region/1', /— Kanata — Twin Dex$/],
    ['/kanata/settings', /^Settings — Twin Dex$/],
    ['/anahua', /^Anahua — Twin Dex$/],
  ]
  for (const [url, pattern] of cases) {
    await page.goto(url)
    await expect(page).toHaveTitle(pattern)
  }
})

test('an entry offers its cry', async ({ page }) => {
  await page.goto('/kanata/pokemon/bidoof')
  await expect(page.getByRole('button', { name: 'Cry' })).toBeVisible()
})

test('an entry with no cry offers no cry button', async ({ page }) => {
  // Neither form present, and an empty string is not a cry either.
  await stubPokeApi(page, { pokemon: { cries: { latest: '', legacy: null } } })
  await page.goto('/kanata/pokemon/bidoof')
  await expect(page.locator('.monpage__title')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cry' })).toHaveCount(0)
})

test('arrow keys on an entry move focus rather than paging between Pokemon', async ({ page }) => {
  await page.goto('/kanata/pokemon/bidoof')
  await expect(page.locator('.monpage__title')).toBeFocused()

  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  // Still the same entry: paging is what Prev and Next are for.
  await expect(page).toHaveURL(/\/kanata\/pokemon\/bidoof$/)

  await page.locator('.monpage__step .btn').last().click()
  await expect(page).not.toHaveURL(/\/bidoof$/)
})

test('Escape on an entry goes back exactly one step', async ({ page }) => {
  await page.goto('/kanata')
  await page.locator('.tile').first().click()
  await expect(page).toHaveURL(/\/kanata\/pokemon$/)

  await page.locator('.dex-card__button').first().click()
  await expect(page).toHaveURL(/\/kanata\/pokemon\/turtwig$/)

  await page.keyboard.press('Escape')
  // One step: back to the list. Two handlers both calling history.back()
  // would overshoot to the menu.
  await expect(page).toHaveURL(/\/kanata\/pokemon$/)
})

test('the screen fades without anything escaping the frame', async ({ page }) => {
  await page.goto('/kanata')
  const bezel = await box(page.locator('.device__bezel'))

  await page.locator('.tile').first().click()
  // Mid-fade, the screen must still be inside the bezel — no scaled snapshot.
  await page.waitForTimeout(60)
  const screen = await box(page.locator('.screen'))
  expect(screen.x).toBeGreaterThanOrEqual(bezel.x - 1)
  expect(screen.x + screen.width).toBeLessThanOrEqual(bezel.x + bezel.width + 1)
  expect(screen.y + screen.height).toBeLessThanOrEqual(bezel.y + bezel.height + 1)

  await expect(page).toHaveURL(/\/kanata\/pokemon$/)
})

test('stat bars are exposed as meters', async ({ page }) => {
  await page.goto('/kanata/pokemon/bidoof')
  const meter = page.locator('.stats__bar').first()
  await expect(meter).toHaveAttribute('role', 'meter')
  await expect(meter).toHaveAttribute('aria-valuemax', '255')
})
