import { useEffect } from 'react'
import { monName } from './format'
import type { DexEntry, Pokemon, Region, Route } from './types'

/**
 * The title for a route, as a lookup rather than a conditional chain.
 *
 * Every route needs its own: the title is what the browser tab, the history
 * entry and a bookmark all read, and "Twin Dex" on all seven of them is
 * useless. Expressing it as a table keeps that obligation visible — a route
 * added without a title is an obvious hole rather than a missing `else if`.
 */
const TITLES: Record<Route['page'], (region: Region, route: Route) => string> = {
  menu: (region) => region.name,
  dex: (region) => `${region.name} Pokédex`,
  region: (region) => `${region.name} Region`,
  settings: () => 'Settings',
  area: (region, route) =>
    `${(route.area !== null && region.sections[route.area]?.label) || region.name} — ${region.name}`,
}

/**
 * Keeps `document.title` in step with the route.
 *
 * An entry page names the species; everything else names the screen. A tab
 * history full of identical titles is unusable.
 */
export function useDocumentTitle(
  route: Route,
  region: Region,
  entry: DexEntry | null,
  mon: Pokemon | undefined,
) {
  useEffect(() => {
    const suffix = 'Twin Dex'
    const title = entry
      ? `${monName(entry, mon)} — ${region.name} Pokédex`
      : (TITLES[route.page]?.(region, route) ?? region.name)

    document.title = `${title} — ${suffix}`
  }, [route, region, entry, mon])
}
