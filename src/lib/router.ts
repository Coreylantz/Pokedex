import regionData from '../data/regions.json'
import type { Page, Region, RegionData, Route } from './types'

/**
 *   /                          the first region's menu
 *   /kanata                    that region's menu
 *   /kanata/pokemon            the dex
 *   /kanata/pokemon/bidoof     one entry
 *   /kanata/region             region info
 *   /kanata/region/3           one area
 *   /kanata/settings           settings
 *
 * `readUrl` and `pathFor` are inverses, and both total: the address bar is user
 * input, so a typo lands on the menu rather than an error.
 */

/** `skin` widens to `string` on import; the generator already validates it. */
const data = regionData as unknown as RegionData

export const regions = data.regions

export const FIRST_REGION: Region = (() => {
  const first = regions[0]
  if (!first) throw new Error('regions.json contains no regions')
  return first
})()

/** Total by design: callers may treat the region as always present. */
export function regionById(id: string | undefined): Region {
  return regions.find((r) => r.id === id) ?? FIRST_REGION
}

export function readUrl(pathname: string = location.pathname): Route {
  const parts = pathname.split('/').filter(Boolean)

  const regionId = regions.some((r) => r.id === parts[0]) ? parts.shift() : FIRST_REGION.id
  const region = regionById(regionId)

  const segment = parts.shift()
  let page: Page = 'menu'
  let mon: string | null = null
  let area: number | null = null

  if (segment === 'pokemon') {
    page = 'dex'
    const slug = parts.shift()
    // An unknown slug drops to the plain dex, so a stale bookmark still lands
    // somewhere useful.
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

  return { regionId: region.id, page, mon, area }
}

export function pathFor({ regionId, page, mon, area }: Route): string {
  const segments: string[] = [regionId]
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

export const hrefFor = (route: Route, patch: Partial<Route>): string =>
  pathFor({ ...route, ...patch })
