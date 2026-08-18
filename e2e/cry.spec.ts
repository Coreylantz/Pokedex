import { expect, test } from '@playwright/test'
import { silentWav, stubPokeApi } from './fixtures/pokeapi'

/**
 * The cry button reports its own state. Verified against a real, tiny WAV
 * served from the test rather than a stub URL — a 404 would take the button
 * away instead, which is correct behaviour but proves nothing about playing.
 */
test('the cry button shows it is playing, then goes back', async ({ page }, testInfo) => {
  // Audio does not start under device emulation, so the button correctly
  // removes itself there instead of playing — right behaviour, but it makes
  // this assertion meaningless. The removal path is covered in dex.spec.js.
  test.skip(
    testInfo.project.name !== 'desktop',
    'audio playback is not available under device emulation',
  )

  await page.route('**/cry.wav', (route) =>
    route.fulfill({ body: silentWav(), contentType: 'audio/wav' }),
  )
  await stubPokeApi(page)

  await page.goto('/kanata/pokemon/bidoof')
  const cry = page.locator('.cry')
  await expect(cry).toHaveAttribute('data-playing', 'false')
  await expect(cry).toHaveText(/Cry/)

  await cry.click()
  await expect(cry).toHaveAttribute('data-playing', 'true')
  await expect(cry).toHaveText(/Playing/)

  // ...and back to rest once the clip ends.
  await expect(cry).toHaveAttribute('data-playing', 'false', { timeout: 5000 })
  await expect(cry).toHaveText(/Cry/)
})
