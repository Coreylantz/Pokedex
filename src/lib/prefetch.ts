import regionData from '../data/regions.json'
import { SUFFIX_PATTERN } from './variants'
import type { RegionData } from './types'

/**
 * Called from a module side effect in `main.tsx` rather than an effect, so the
 * requests leave before React mounts and the route resolves — on a slow
 * connection that is most of a second of otherwise idle network.
 */
const FIRST_SCREEN = 12
const API = 'https://pokeapi.co/api/v2'
const SPRITES = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'

const data = regionData as unknown as RegionData

function regionFromPath(pathname: string) {
  const parts = pathname.split('/').filter(Boolean)
  return data.regions.find((r) => r.id === parts[0]) ?? data.regions[0]
}

export function prefetchFirstScreen() {
  if (!location.pathname.includes('/pokemon')) return

  const region = regionFromPath(location.pathname)
  if (!region) return

  const first = region.sections
    .flatMap((section) => section.entries)
    .slice(0, FIRST_SCREEN)

  const quiet = () => {
    // A warm-up must never surface an error of its own; the dex loader retries
    // and reports properly.
  }

  for (const entry of first) {
    // `fetch` rather than <link rel=preload>: a hint is a separate request from
    // the app's, so the same URL would be fetched twice.
    void fetch(`${API}/pokemon/${entry.slug}`, { priority: 'high' }).catch(quiet)

    // Sprite URL derived from the national number instead of waiting for
    // /pokemon, saving a round trip. Not valid for form suffixes: an alternate
    // form keeps its species' number but is filed above 10000.
    if (!SUFFIX_PATTERN.test(entry.slug)) {
      void fetch(`${SPRITES}/${entry.nationalNo}.png`, { mode: 'no-cors' }).catch(quiet)
    }
  }
}
