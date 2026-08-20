import { describe, expect, it, vi, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { must, q, qa, nth, text } from './test/dom'
import { speciesName } from './lib/format'
import type { RegionData } from './lib/types'
import rawRegionData from './data/regions.json'

// The generator validates this shape; the JSON import widens the unions.
const regionData = rawRegionData as unknown as RegionData
/** Mounts the whole app against a stubbed PokeAPI, so a runtime error cannot ship silently. */

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

// Tells React that act() is legitimate here rather than a misuse in production.
globalThis.IS_REACT_ACT_ENVIRONMENT = true

function regionAt(index: number) {
  const region = regionData.regions[index]
  if (!region) throw new Error(`regions.json has no region at ${index}`)
  return region
}

function stubApi({ failSprites = false } = {}) {
  vi.stubGlobal('fetch', async (input: RequestInfo | URL) => {
    const url = String(input)
    if (!url.includes('pokeapi.co')) {
      // A sprite request.
      return new Response(failSprites ? '' : 'png', { status: failSprites ? 502 : 200 })
    }
    if (url.includes('/pokemon-species/')) {
      return new Response(
        JSON.stringify({
          names: [{ language: { name: 'en' }, name: 'Testmon' }],
          genera: [{ language: { name: 'en' }, genus: 'Test Pokémon' }],
          flavor_text_entries: [{ language: { name: 'en' }, flavor_text: 'A test\nentry.' }],
          is_legendary: false,
          is_mythical: false,
        }),
        { headers: { 'content-type': 'application/json' } },
      )
    }
    // The client resolves the species endpoint from `species.name`, not the
    // slug, so the stub has to supply it.
    const slug = url.split('/pokemon/')[1] ?? ''
    return new Response(
      JSON.stringify({
        id: 1,
        height: 7,
        weight: 69,
        // The shared stripper: a local copy had already drifted out of step.
        species: { name: speciesName(slug) },
        types: [{ slot: 1, type: { name: 'grass' } }],
        stats: [{ stat: { name: 'hp' }, base_stat: 45 }],
        sprites: { front_default: 'https://x/1.png', front_shiny: 'https://x/1s.png' },
      }),
      { headers: { 'content-type': 'application/json' } },
    )
  })
}

describe('Twin Dex', () => {
  beforeEach(() => {
    localStorage.clear()
    stubApi()
  })

  /** A lazy route resolves in stages, so one tick lands mid-way on the fallback. */
  async function settle(rounds = 4) {
    for (let i = 0; i < rounds; i++) {
      await act(async () => {
        await new Promise((r) => setTimeout(r, 120))
      })
    }
  }

  /** Mounts the app and lets the streaming loaders settle. */
  async function mount(url = '/kanata') {
    const container = document.createElement('div')
    document.body.append(container)
    history.replaceState(null, '', url)
    await act(async () => {
      createRoot(container).render(<App />)
    })
    await settle()
    return container
  }

  /** Clicks, then waits out the fade the navigation is deferred behind. */
  const open = async (el: HTMLElement) => {
    await act(async () => {
      el.click()
    })
    await settle()
  }

  it('opens on a menu rather than straight into the list', async () => {
    const container = await mount()
    const kanata = regionAt(0)

    expect(text(container, '.menu__title')).toBe(kanata.name)
    expect(container.querySelector('.dex-grid')).toBeNull()
    expect(qa(container, '.tile__label').map((el) => el.textContent)).toEqual([
      'Pokémon',
      'Region',
      'Settings',
    ])
  })

  it('lists every entry in flat regional order with no section headings', async () => {
    const container = await mount('/kanata/pokemon')
    const kanata = regionAt(0)
    const anahua = regionAt(1)

    expect(container.querySelectorAll('.dex-card')).toHaveLength(kanata.count)
    // A Pokedex is a numbered list, not a travelogue.
    expect(container.querySelector('.dex-section')).toBeNull()
    const numbers = qa(container, '.dex-card__no').map((el) =>
      Number(el.textContent),
    )
    expect(numbers).toEqual(numbers.map((_, i) => i + 1))

    const sprites = container.querySelectorAll('.dex-card__sprite')
    expect(sprites).toHaveLength(kanata.count)
    // Decorative: the name is in the same link, so alt text would read twice.
    for (const img of sprites) expect(img.getAttribute('alt')).toBe('')
    expect(q(container, '.app').dataset.skin).toBe('gen1')

    // Switching regions swaps the hardware and returns to that region's menu.
    await open(q(container, `#tab-${anahua.id}`))
    expect(q(container, '.app').dataset.skin).toBe('gen2')
    expect(text(container, '.menu__title')).toBe(anahua.name)
  })

  it('opens an area from the Region page the way it opens a Pokemon', async () => {
    const container = await mount()
    const kanata = regionAt(0)

    await open(nth(container, '.tile', 1))
    expect(location.pathname).toBe('/kanata/region')
    expect(text(container, '.page__title')).toBe(kanata.name)
    expect(container.querySelectorAll('.area__button')).toHaveLength(kanata.sections.length)

    // Information only: repeating the Pokemon here would be a second dex.
    await open(nth(container, '.area__button', 0))
    expect(text(container, '.page__title')).toBe(must(kanata.sections[0], 'first section').label)
    expect(text(container, '.page__blurb')).toBe(must(kanata.sections[0], 'first section').note)
    expect(container.querySelector('.dex-card')).toBeNull()
  })

  it('keeps the offline controls in Settings, not on the dex', async () => {
    const container = await mount('/kanata/pokemon')
    expect(container.querySelector('.setting__status')).toBeNull()

    const menu = await mount('/kanata/settings')
    expect(text(menu, '.page__title')).toBe('Settings')
    expect(menu.querySelector('.setting__status')).not.toBeNull()
  })

  it('defaults to the digital typeface and persists a change', async () => {
    const container = await mount('/kanata/settings')
    expect(q(container, '.app').dataset.typeface).toBe('digital')

    const select = q<HTMLSelectElement>(container, '.setting__select')
    await act(async () => {
      select.value = 'readable'
      select.dispatchEvent(new Event('change', { bubbles: true }))
    })
    expect(q(container, '.app').dataset.typeface).toBe('readable')
    expect(JSON.parse(localStorage.getItem('twindex:settings:v1') ?? '{}').typeface).toBe('readable')
  })

  it('groups the accessibility controls and applies them to the device', async () => {
    const container = await mount('/kanata/settings')

    // One Settings screen, not a Settings/Device split.
    const groups = qa(container, '.page__subhead').map((h) => h.textContent)
    expect(groups).toEqual(['Accessibility', 'Sound & feel', 'Device', 'Offline data'])

    const app = q(container, '.app')
    expect(app.dataset.textSize).toBe('normal')
    expect(app.dataset.contrast).toBe('false')
    expect(app.dataset.reduceMotion).toBe('false')

    // Text size is the second control in the Accessibility group.
    const size = nth<HTMLSelectElement>(container, '.setting__select', 1)
    await act(async () => {
      size.value = 'largest'
      size.dispatchEvent(new Event('change', { bubbles: true }))
    })
    expect(app.dataset.textSize).toBe('largest')

    const toggles = qa(container, '.setting input[type="checkbox"]')
    await act(async () => {
      must(toggles[0], 'the first toggle').click()
    })
    expect(app.dataset.contrast).toBe('true')
    expect(JSON.parse(localStorage.getItem('twindex:settings:v1') ?? '{}').contrast).toBe(true)
  })

  it('only applies the text search once it is submitted', async () => {
    const container = await mount('/kanata/pokemon')
    const all = container.querySelectorAll('.dex-card').length

    await open(q(container, '.page__bar-end'))
    const input = q<HTMLInputElement>(container, '.finder__input')
    await act(async () => {
      // React tracks the previous value on the node, so a plain assignment is
      // ignored.
      must(
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set,
        'the native value setter',
      ).call(input, '001')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    // Typing alone must not disturb the list.
    expect(container.querySelectorAll('.dex-card')).toHaveLength(all)

    await act(async () => {
      q(container, '.finder__form').dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      )
    })
    expect(container.querySelectorAll('.dex-card').length).toBeLessThan(all)
    // The search field carries a real label rather than placeholder text.
    expect(input.getAttribute('placeholder')).toBeNull()
    expect(container.querySelector(`label[for="${input.id}"]`)).not.toBeNull()
  })

  it('exposes each base stat bar as a meter rather than hiding it', async () => {
    const container = await mount('/kanata/pokemon')
    await open(q(container, '.dex-card__button'))

    const meters = qa(container, '.stats__bar')
    expect(meters.length).toBeGreaterThan(0)
    for (const meter of meters) {
      expect(meter.getAttribute('aria-hidden')).toBeNull()
      expect(meter.getAttribute('role')).toBe('meter')
      expect(meter.getAttribute('aria-valuenow')).toBeTruthy()
      expect(meter.getAttribute('aria-valuemax')).toBe('255')
      // Named by its stat, so "45 of 255" is attached to something.
      const label = q(container, `#${CSS.escape(meter.getAttribute('aria-labelledby') ?? '')}`)
      expect(label).not.toBeNull()
    }
  })

  it('moves focus with the on-device D-pad', async () => {
    const container = await mount('/kanata/pokemon')
    const cards = qa(container, '.dex-card__button')
    must(cards[0], 'the first card').focus()

    const right = q(container, '.dpad__btn--right')

    // A real browser focuses a button on mousedown, dragging focus out of the
    // screen. jsdom's .click() moves no focus, so assert the cancellation
    // rather than trusting it.
    const mousedown = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    await act(async () => {
      right.dispatchEvent(mousedown)
    })
    expect(mousedown.defaultPrevented).toBe(true)

    await act(async () => {
      right.click()
    })
    expect(document.activeElement).toBe(must(cards[1], 'the second card'))

    // The round buttons are Enter.
    await act(async () => {
      q(container, '.pad--a').click()
    })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 250))
    })
    expect(container.querySelector('.monpage')).not.toBeNull()
  })

  it('opens an entry as a page, not a dialog, and Back returns to the list', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    history.replaceState(null, '', '/kanata/pokemon')

    await act(async () => {
      createRoot(container).render(<App />)
    })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 250))
    })

    const kanata = regionAt(0)
    const first = must(must(kanata.sections[0], 'first section').entries[0], 'first entry')

    await open(q(container, `[data-slug="${first.slug}"]`))

    // The listing is replaced, not overlaid, and nothing modal is involved.
    expect(container.querySelector('.monpage')).not.toBeNull()
    expect(container.querySelector('.dex-grid')).toBeNull()
    expect(container.querySelector('dialog')).toBeNull()
    // It is a real navigation: the URL carries it and focus moves to the title.
    expect(location.pathname).toBe(`/kanata/pokemon/${first.slug}`)
    expect(document.activeElement).toBe(container.querySelector('.monpage__title'))

    // Back returns to the listing and restores focus to the card left behind.
    await act(async () => {
      history.back()
      await new Promise((r) => setTimeout(r, 250))
    })
    expect(container.querySelector('.dex-grid')).not.toBeNull()
    expect(container.querySelector('.monpage')).toBeNull()
    expect(location.pathname).toBe('/kanata/pokemon')
    expect(document.activeElement).toBe(container.querySelector(`[data-slug="${first.slug}"]`))
  })

  it('never downloads the whole dex without being asked', async () => {
    // ~4 MB over ~1,320 requests used to fire on first visit. Nothing may reach
    // for the full dex on its own.
    const container = await mount('/kanata/pokemon')

    expect(localStorage.getItem('twindex:primed:v2')).toBeNull()
    const settings = await mount('/kanata/settings')
    expect(settings.textContent).toContain('saved as you open them')
    expect(container.textContent).not.toContain('available with no network')
  })

  it('does not report the dex as offline-ready when the download is incomplete', async () => {
    stubApi({ failSprites: true })
    const container = await mount('/kanata/settings')

    // The download only runs when asked for, so ask for it.
    const save = qa<HTMLButtonElement>(container, '.btn').find((b) =>
      b.textContent?.includes('Save for offline'),
    )
    expect(save).toBeDefined()
    await act(async () => {
      save?.click()
    })
    await settle(6)

    // Every sprite 502s, so the pass must not be recorded as complete.
    expect(localStorage.getItem('twindex:primed:v2')).toBeNull()
    // The exact wording Settings shows: a string the app never renders would
    // pass no matter what.
    expect(container.textContent).not.toContain('available with no network')
  })
})

describe('dex data', () => {
  const all = regionData.regions

  it('uses default species only, never an alternate form', () => {
    for (const region of all) {
      for (const section of region.sections) {
        for (const entry of section.entries) {
          expect(entry.nationalNo).toBeGreaterThanOrEqual(1)
          // Alternate forms are numbered from 10000 and 404 on /pokemon-species.
          expect(entry.nationalNo).toBeLessThan(10000)
        }
      }
    }
  })

  it('assigns each region a Pokedex hardware skin', () => {
    expect(all.map((r) => r.skin)).toEqual(['gen1', 'gen2'])
  })

  it('shares no species between the two regions', () => {
    const [a, b] = all.map(
      (r) => new Set(r.sections.flatMap((s) => s.entries.map((e) => e.slug))),
    )
    expect([...must(a, 'kanata slugs')].filter((slug) => must(b, 'anahua slugs').has(slug))).toEqual([])
  })

  it('never places a starter line outside a starters section', () => {
    // Every species that is a starter in some generation, by national number.
    const starterRanges = [
      [1, 9], [152, 160], [252, 260], [387, 395], [495, 503],
      [650, 658], [722, 730], [810, 818], [906, 914],
    ]
    const isStarter = (no: number) => starterRanges.some((range) => no >= (range[0] ?? 0) && no <= (range[1] ?? 0))

    for (const region of all) {
      expect(must(region.sections[0], 'starters section').label).toMatch(/Starters$/)
      for (const entry of must(region.sections[0], 'starters section').entries) {
        expect(isStarter(entry.nationalNo)).toBe(true)
      }
      for (const section of region.sections.slice(1)) {
        for (const entry of section.entries) {
          expect({ slug: entry.slug, starter: isStarter(entry.nationalNo) }).toEqual({
            slug: entry.slug,
            starter: false,
          })
        }
      }
    }
  })

  it('keeps primates and kaiju designs out of Kanata', () => {
    // No primates north of the treeline, and no kaiju in a wildlife region.
    const banned = new Set([
      'mankey', 'primeape', 'annihilape', 'aipom', 'ambipom',
      'chimchar', 'monferno', 'infernape',
      'pansage', 'simisage', 'pansear', 'simisear', 'panpour', 'simipour',
      'darumaka', 'darmanitan', 'slakoth', 'vigoroth', 'slaking',
      'oranguru', 'passimian', 'grookey', 'thwackey', 'rillaboom',
      'nidoking', 'nidoqueen', 'rhydon', 'rhyperior',
      'aron', 'lairon', 'aggron', 'larvitar', 'pupitar', 'tyranitar',
      'gyarados', 'groudon', 'kyogre', 'regigigas',
    ])
    const kanata = all.find((r) => r.id === 'kanata')
    const slugs = must(kanata, 'the Kanata region').sections.flatMap((s) => s.entries.map((e) => e.slug))
    expect(slugs.filter((slug) => banned.has(slug))).toEqual([])
  })

  it('has no Magikarp in either region', () => {
    for (const region of all) {
      const slugs = region.sections.flatMap((s) => s.entries.map((e) => e.slug))
      expect(slugs).not.toContain('magikarp')
      expect(slugs).not.toContain('gyarados')
    }
  })

  it('numbers each regional dex contiguously from 1', () => {
    for (const region of all) {
      const numbers = region.sections.flatMap((s) => s.entries.map((e) => e.regionalNo))
      expect(numbers).toEqual(numbers.map((_, i) => i + 1))
      expect(numbers).toHaveLength(region.count)
    }
  })

  it('has no duplicate species within a region', () => {
    for (const region of all) {
      const slugs = region.sections.flatMap((s) => s.entries.map((e) => e.slug))
      expect(new Set(slugs).size).toBe(slugs.length)
    }
  })

  it('opens each region with a Grass/Fire/Water starter trio', () => {
    for (const region of all) {
      const first = must(region.sections[0], 'starters section').entries
      expect(first).toHaveLength(9)
      // Starter trios are always the three lines at the head of a regional dex.
      expect(first.map((e) => e.regionalNo)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    }
  })

  it('places the legendaries in the final section', () => {
    const legendaries = new Set([
      // Kanata: Zapdos, Kyurem, Lugia, Celebi
      145, 646, 249, 251,
      // Anahua: Ho-Oh, Rayquaza, Groudon, Mew
      250, 384, 383, 151,
    ])
    for (const region of all) {
      const last = must(region.sections.at(-1), `the last section of ${region.id}`)
      expect(last.label).toMatch(/^Legends of/)
      for (const entry of last.entries) expect(legendaries.has(entry.nationalNo)).toBe(true)
      // ...and nowhere else.
      for (const section of region.sections.slice(0, -1)) {
        for (const entry of section.entries) {
          expect(legendaries.has(entry.nationalNo)).toBe(false)
        }
      }
    }
  })

  it('keeps evolution lines adjacent and in ascending stage order', () => {
    // Non-sequential national numbers, where an ordering mistake would hide.
    const lines = [
      ['pichu', 'pikachu', 'raichu'],
      ['cleffa', 'clefairy', 'clefable'],
      ['magby', 'magmar', 'magmortar'],
      ['onix', 'steelix'],
      ['chikorita', 'bayleef', 'meganium'],
      ['zubat', 'golbat', 'crobat'],
      ['teddiursa', 'ursaring', 'ursaluna'],
      ['stantler', 'wyrdeer'],
      ['swinub', 'piloswine', 'mamoswine'],
      ['sneasel', 'weavile'],
      ['rockruff', 'lycanroc-midday'],
      ['basculin-red-striped', 'basculegion-male'],
      ['mankey', 'primeape', 'annihilape'],
      ['gligar', 'gliscor'],
      ['tangela', 'tangrowth'],
      ['aipom', 'ambipom'],
      ['misdreavus', 'mismagius'],
      ['mantyke', 'mantine'],
      ['tyrogue', 'hitmonlee', 'hitmonchan', 'hitmontop'],
    ]
    for (const region of all) {
      const order = region.sections.flatMap((s) => s.entries.map((e) => e.slug))
      for (const line of lines) {
        if (!line.every((slug) => order.includes(slug))) continue
        const positions = line.map((slug) => order.indexOf(slug))
        const start = must(positions[0], `a position for ${line[0]}`)
        expect(positions).toEqual(line.map((_, i) => start + i))
      }
    }
  })
})
