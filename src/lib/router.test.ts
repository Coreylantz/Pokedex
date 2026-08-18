import { describe, expect, it } from 'vitest'
import { FIRST_REGION, pathFor, readUrl, regionById, regions } from './router'

/**
 * The address bar is user input, so `readUrl` has to be total: every string
 * resolves to some route. These are the malformed ones — the cases a typo, a
 * stale bookmark or a hand-edited URL actually produces, which the UI tests
 * cannot reach because the UI never generates them.
 */
describe('readUrl', () => {
  it('falls back to the first region on an empty or unknown path', () => {
    for (const path of ['/', '', '//', '/nowhere', '/nowhere/pokemon']) {
      expect(readUrl(path).regionId).toBe(FIRST_REGION.id)
    }
  })

  it('defaults to the menu', () => {
    expect(readUrl('/kanata').page).toBe('menu')
    expect(readUrl('/').page).toBe('menu')
  })

  it('ignores an unknown page segment rather than erroring', () => {
    const route = readUrl('/kanata/nonsense')
    expect(route.page).toBe('menu')
    expect(route.regionId).toBe('kanata')
  })

  it('drops an entry slug that is not in that region', () => {
    // Anahua's starter is not in Kanata, so the slug is refused rather than
    // rendering an entry page the region does not contain.
    expect(readUrl('/kanata/pokemon/treecko').mon).toBeNull()
    expect(readUrl('/kanata/pokemon/nonsense').mon).toBeNull()
    expect(readUrl('/kanata/pokemon/').mon).toBeNull()
  })

  it('keeps an entry slug that is in that region', () => {
    const first = FIRST_REGION.sections[0]?.entries[0]
    expect(first).toBeDefined()
    const route = readUrl(`/${FIRST_REGION.id}/pokemon/${first?.slug}`)
    expect(route.mon).toBe(first?.slug)
    expect(route.page).toBe('dex')
  })

  it('only treats a real area index as an area', () => {
    expect(readUrl('/kanata/region').page).toBe('region')
    expect(readUrl('/kanata/region/0')).toMatchObject({ page: 'area', area: 0 })
    // Out of range, not a number, and negative all fall back to the region page.
    for (const bad of ['999', 'abc', '-1', '1.5', '']) {
      const route = readUrl(`/kanata/region/${bad}`)
      expect({ bad, page: route.page, area: route.area }).toEqual({
        bad,
        page: 'region',
        area: null,
      })
    }
  })

  it('reads the explained prefix, and only as a prefix', () => {
    expect(readUrl('/explained/kanata/pokemon').explained).toBe(true)
    expect(readUrl('/kanata/pokemon').explained).toBe(false)
    // `explained` in any other position is just an unknown segment.
    expect(readUrl('/kanata/explained').explained).toBe(false)
  })

  it('treats a bare /explained as the first region', () => {
    expect(readUrl('/explained')).toMatchObject({
      regionId: FIRST_REGION.id,
      page: 'menu',
      explained: true,
    })
  })

  it('tolerates trailing slashes and repeated separators', () => {
    expect(readUrl('/kanata//pokemon//').page).toBe('dex')
    expect(readUrl('/kanata/settings/').page).toBe('settings')
  })
})

describe('pathFor', () => {
  it('round-trips every page', () => {
    const first = FIRST_REGION.sections[0]?.entries[0]
    const routes = [
      { regionId: 'kanata', page: 'menu', mon: null, area: null, explained: false },
      { regionId: 'kanata', page: 'dex', mon: null, area: null, explained: false },
      { regionId: 'kanata', page: 'dex', mon: first?.slug ?? null, area: null, explained: false },
      { regionId: 'kanata', page: 'region', mon: null, area: null, explained: false },
      { regionId: 'kanata', page: 'area', mon: null, area: 1, explained: false },
      { regionId: 'kanata', page: 'settings', mon: null, area: null, explained: false },
      { regionId: 'kanata', page: 'dex', mon: null, area: null, explained: true },
    ] as const

    for (const route of routes) {
      expect(readUrl(pathFor(route))).toEqual(route)
    }
  })

  it('always produces an absolute path', () => {
    expect(pathFor({ regionId: 'kanata', page: 'menu', mon: null, area: null, explained: false }))
      .toBe('/kanata')
  })
})

describe('regionById', () => {
  it('returns the named region', () => {
    for (const region of regions) {
      expect(regionById(region.id).id).toBe(region.id)
    }
  })

  it('falls back rather than returning undefined', () => {
    expect(regionById('nope')).toBe(FIRST_REGION)
    expect(regionById(undefined)).toBe(FIRST_REGION)
  })
})
