import regionData from '../data/regions.json'
import type { Page, Region, RegionData, Route } from './types'

/**
 * Routing, and the region data the routes are validated against.
 *
 * Everything lives in the path rather than the query string:
 *
 *   /                          the first region's menu
 *   /kanata                    that region's menu
 *   /kanata/pokemon            the dex
 *   /kanata/pokemon/bidoof     one entry
 *   /kanata/region             region info
 *   /kanata/region/3           one area
 *   /kanata/settings           settings
 *
 * An `/explained` prefix swaps an entry's stats for the reasoning behind it.
 * It is deliberately unlinked — you get there by typing it.
 *
 * `readUrl` and `pathFor` are inverses, and both are total: any URL resolves to
 * some route rather than throwing or 404ing, because the address bar is user
 * input and a typo should land on the menu, not on an error.
 */

/**
 * The generated JSON is structurally correct but typed loosely on import —
 * `skin` widens to `string`, and the criteria keys widen to `string`. The
 * generator validates both, so this is asserted once here rather than
 * re-checked at every use.
 */
const data = regionData as unknown as RegionData

export const regions = data.regions
export const criteria = data.criteria

/** Typed as present, not merely checked: every fallback below relies on it. */
export const FIRST_REGION: Region = (() => {
  const first = regions[0]
  if (!first) throw new Error('regions.json contains no regions')
  return first
})()

/**
 * The region for an id, falling back to the first. Always returns one, which
 * is what lets every caller treat the region as present.
 */
export function regionById(id: string | undefined): Region {
  return regions.find((r) => r.id === id) ?? FIRST_REGION
}

export function readUrl(pathname: string = location.pathname): Route {
  const parts = pathname.split('/').filter(Boolean)
  const explained = parts[0] === 'explained'
  if (explained) parts.shift()

  const regionId = regions.some((r) => r.id === parts[0]) ? parts.shift() : FIRST_REGION.id
  const region = regionById(regionId)

  const segment = parts.shift()
  let page: Page = 'menu'
  let mon: string | null = null
  let area: number | null = null

  if (segment === 'pokemon') {
    page = 'dex'
    const slug = parts.shift()
    // An unknown slug drops to the plain dex rather than showing an empty
    // entry page, so a stale bookmark still lands somewhere useful.
    if (region.sections.some((s) => s.entries.some((e) => e.slug === slug))) mon = slug ?? null
  } else if (segment === 'region') {
    page = 'region'
    const index = Number(parts.shift())
    if (Number.isInteger(index) && region.sections[index]) {
      page = 'area'
      area = index
    }
  } else if (segment === 'settings') {
    page = 'settings'
  }

  return { regionId: region.id, page, mon, area, explained }
}

export function pathFor({ regionId, page, mon, area, explained }: Route): string {
  const segments: string[] = []
  if (explained) segments.push('explained')
  segments.push(regionId)
  if (page === 'dex') {
    segments.push('pokemon')
    if (mon) segments.push(mon)
  } else if (page === 'region') {
    segments.push('region')
  } else if (page === 'area') {
    segments.push('region', String(area))
  } else if (page === 'settings') {
    segments.push('settings')
  }
  return `/${segments.join('/')}`
}
