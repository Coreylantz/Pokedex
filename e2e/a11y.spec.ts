import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import type { Result } from 'axe-core'
import { settled, stubPokeApi } from './fixtures/pokeapi'

/**
 * Automated WCAG 2.1 A/AA scan of every route, at all three viewports, plus
 * axe's best-practice set.
 *
 * The best-practice rules were originally scoped out, with a comment arguing
 * that this shell "genuinely departs" from `landmark-one-main`. That argument
 * was wrong, and the scoping hid a real defect: `role="tabpanel"` had been put
 * on `<main>`, which replaces the landmark rather than adding to it, so the
 * document had no main landmark at all. Lighthouse found it; this suite could
 * not, because the rule was out of scope.
 *
 * So the tag scope now includes best-practice, and nothing is disabled.
 */
const WCAG = [
  'wcag2a',
  'wcag2aa',
  'wcag2aaa',
  'wcag21a',
  'wcag21aa',
  'wcag21aaa',
  'wcag22aa',
  'best-practice',
]

const ROUTES: [name: string, url: string][] = [
  ['menu', '/kanata'],
  ['dex', '/kanata/pokemon'],
  ['entry', '/kanata/pokemon/bidoof'],
  ['region', '/kanata/region'],
  ['area', '/kanata/region/0'],
  ['settings', '/kanata/settings'],
]

const scan = (page: Page) => new AxeBuilder({ page }).withTags(WCAG)

/**
 * Names, node counts and the offending selectors, so a failure says what broke
 * and where — not just "1 !== 0", and not just a rule id you then have to go
 * hunting for in a trace.
 */
const summarise = (violations: Result[]) =>
  violations.map((v) => {
    const where = v.nodes
      .slice(0, 3)
      .map((n) => n.target.join(' '))
      .join(' | ')
    return `${v.id} (${v.nodes.length}): ${v.help} -> ${where}`
  })

test.beforeEach(async ({ page }) => {
  await stubPokeApi(page)
})

for (const [name, url] of ROUTES) {
  test(`${name} has no WCAG 2.1 AA violations`, async ({ page }) => {
    await page.goto(url)
    await settled(page, expect, url)
    const { violations } = await scan(page).analyze()
    expect(summarise(violations)).toEqual([])
  })
}

test('the gen2 skin has no WCAG 2.1 AA violations', async ({ page }) => {
  // A different palette is a different set of colour pairs.
  await page.goto('/anahua/pokemon')
  await settled(page, expect, '/anahua/pokemon')
  const { violations } = await scan(page).analyze()
  expect(summarise(violations)).toEqual([])
})

test('the shell-off layout has no WCAG 2.1 AA violations', async ({ page }) => {
  // With the shell gone the tabs move onto the screen: a different tree.
  await page.goto('/kanata/settings')
  await page.locator('.setting', { hasText: 'Device frame' }).locator('.switch').click()
  await expect(page.locator('.app')).toHaveAttribute('data-shell', 'false')
  const { violations } = await scan(page).analyze()
  expect(summarise(violations)).toEqual([])
})

test('high contrast at largest text has no WCAG 2.1 AA violations', async ({ page }) => {
  await page.goto('/kanata/settings')
  await page.selectOption('.setting__select >> nth=1', 'largest')
  await page.locator('.setting', { hasText: 'High contrast' }).locator('.switch').click()
  await page.goto('/kanata/pokemon/bidoof')
  await settled(page, expect, '/kanata/pokemon/bidoof')
  const { violations } = await scan(page).analyze()
  expect(summarise(violations)).toEqual([])
})

test('the open search panel has no WCAG 2.1 AA violations', async ({ page }) => {
  // The panel is unmounted while collapsed, so it is never in the other scans.
  await page.goto('/kanata/pokemon')
  await settled(page, expect, '/kanata/pokemon')
  await page.locator('.page__bar-end').click()
  await expect(page.locator('.finder__panel')).toBeVisible()
  const { violations } = await scan(page).analyze()
  expect(summarise(violations)).toEqual([])
})
