import type { Expect, Locator, Page } from '@playwright/test'

/**
 * One stub for every spec: copy-pasted payloads had already drifted, and tests
 * that disagree about their own fixture are testing different apps.
 *
 * Nothing here touches the network — sprites resolve to a local icon.
 */

const SPECIES = {
  names: [{ language: { name: 'en' }, name: 'Bidoof' }],
  genera: [{ language: { name: 'en' }, genus: 'Plump Mouse Pokémon' }],
  flavor_text_entries: [
    { language: { name: 'en' }, flavor_text: 'It builds dams with wood and mud.' },
  ],
  is_legendary: false,
  is_mythical: false,
}

const POKEMON = {
  id: 399,
  height: 5,
  weight: 200,
  types: [{ slot: 1, type: { name: 'normal' } }],
  stats: [
    { stat: { name: 'hp' }, base_stat: 59 },
    { stat: { name: 'special-attack' }, base_stat: 31 },
  ],
  sprites: { front_default: '/icons/icon-192.png', front_shiny: '/icons/icon-192.png' },
  cries: { latest: '/cry.wav', legacy: null },
}

interface Overrides {
  /** `types` and `stats` replace wholesale, which is what a caller varying them wants. */
  pokemon?: Record<string, unknown>
  species?: Record<string, unknown>
}

export async function stubPokeApi(page: Page, { pokemon = {}, species = {} }: Overrides = {}) {
  await page.route('**/pokeapi.co/**', (route) => {
    const url = route.request().url()
    if (url.includes('/pokemon-species/')) {
      return route.fulfill({ json: { ...SPECIES, ...species } })
    }
    // The client resolves the species endpoint from `species.name`, not the slug.
    const slug = url.split('/pokemon/')[1]
    return route.fulfill({ json: { ...POKEMON, species: { name: slug }, ...pokemon } })
  })

  await page.route('**/raw.githubusercontent.com/**', (route) =>
    route.fulfill({ path: 'dist/icons/icon-192.png' }),
  )
}

/** Built as bytes so no audio asset is needed, and long enough not to race. */
export function silentWav(seconds = 2) {
  const rate = 8000
  const samples = rate * seconds
  const buffer = Buffer.alloc(44 + samples)
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + samples, 4)
  buffer.write('WAVEfmt ', 8)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20) // PCM
  buffer.writeUInt16LE(1, 22) // mono
  buffer.writeUInt32LE(rate, 24)
  buffer.writeUInt32LE(rate, 28)
  buffer.writeUInt16LE(1, 32)
  buffer.writeUInt16LE(8, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(samples, 40)
  buffer.fill(128, 44) // silence, for 8-bit PCM
  return buffer
}

/**
 * Every caller has already asserted visibility, so a null box is a bug in the
 * test rather than a case to handle. Fails readably instead of `possibly null`.
 */
export async function box(locator: Locator) {
  const rect = await locator.boundingBox()
  if (!rect) throw new Error('element has no bounding box; is it visible?')
  return rect
}

/** Waits for a route's real content, so a scan measures the app not a skeleton. */
export async function settled(page: Page, expect: Expect, url: string) {
  const entry = url.includes('/pokemon/') && url.split('/pokemon/')[1]
  if (entry) {
    await expect(page.locator('.monpage__title')).toBeVisible()
    await expect(page.locator('.stats__bar').first()).toBeVisible()
  } else if (url.endsWith('/pokemon')) {
    await expect(page.locator('.dex-card__sprite').first()).toBeVisible()
  } else {
    await expect(page.locator('.page__title, .menu__title').first()).toBeVisible()
  }
}
