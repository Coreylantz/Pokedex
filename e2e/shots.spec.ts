import { test } from '@playwright/test'
import { stubPokeApi } from './fixtures/pokeapi'

/**
 * Not assertions — a way to actually look at the thing. Run with
 * `npx playwright test e2e/shots.spec.js --project=desktop` and open
 * `shots/`.
 */
const SHOTS: [name: string, url: string][] = [
  ['menu', '/kanata'],
  ['dex', '/kanata/pokemon'],
  ['entry', '/kanata/pokemon/bidoof'],
  ['region', '/kanata/region'],
  ['settings', '/kanata/settings'],
  ['anahua-menu', '/anahua'],
]

for (const [name, url] of SHOTS) {
  test(`shot: ${name}`, async ({ page }, testInfo) => {
    // A full stat spread, so the screenshots show more than one bar.
    await stubPokeApi(page, {
      pokemon: {
        stats: [
          { stat: { name: 'hp' }, base_stat: 59 },
          { stat: { name: 'attack' }, base_stat: 45 },
          { stat: { name: 'defense' }, base_stat: 40 },
        ],
      },
    })
    await page.goto(url)
    await page.waitForTimeout(400)
    await page.screenshot({ path: `shots/${testInfo.project.name}-${name}.png` })
  })
}
