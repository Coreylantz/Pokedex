import { test } from '@playwright/test'
import { stubPokeApi } from './fixtures/pokeapi'

/** A look at the focus states, which are hard to judge from computed styles. */
test('shot: focus', async ({ page }) => {
  // No cry, so the last shot below captures the button's absence.
  await stubPokeApi(page, { pokemon: { cries: { latest: null, legacy: null } } })

  await page.goto('/kanata')
  await page.locator('.tile').first().focus()
  await page.locator('.dpad__btn--right').click()
  await page.screenshot({ path: 'shots/focus-menu.png' })

  await page.goto('/kanata/pokemon')
  await page.waitForTimeout(400)
  await page.locator('.dex-card__button').first().focus()
  await page.locator('.dpad__btn--right').click()
  await page.screenshot({ path: 'shots/focus-card.png' })

  // And an entry whose cry is absent: the button must not be offered.
  await page.goto('/kanata/pokemon/bidoof')
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'shots/no-cry.png' })
})
