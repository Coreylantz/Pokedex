import regionData from '../data/regions.json'
import { SUFFIX_PATTERN } from './variants'
import type { RegionData } from './types'

/**
 * Warms the first screenful of the dex before React has finished booting.
 *
 * The dex loader is honest but late: it cannot start until the entry chunk has
 * parsed, React has mounted and the route has resolved. On a slow connection
 * that is most of a second during which the network is idle and the grid the
 * reader is about to look at has not been asked for.
 *
 * This runs from a module side effect at the very top of `main.tsx`, so the
 * requests for the first twelve species leave while the framework is still
 * starting. Nothing here renders anything: the responses land in the HTTP and
 * service-worker caches, and `loadPokemon` finds them already there.
 *
 * Twelve because that is roughly two screenfuls of grid on a phone — enough to
 * cover the first scroll without spending the reader's bandwidth on entries
 * they may never reach.
 */
const FIRST_SCREEN = 12
const API = 'https://pokeapi.co/api/v2'
const SPRITES = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'

const data = regionData as unknown as RegionData

/** Which region the URL is asking for, without waiting for the router. */
function regionFromPath(pathname: string) {
  const parts = pathname.split('/').filter(Boolean)
  if (parts[0] === 'explained') parts.shift()
  return data.regions.find((r) => r.id === parts[0]) ?? data.regions[0]
}

export function prefetchFirstScreen() {
  // Only for the dex itself. Landing on the menu or settings should not spend
  // a dozen requests on a list that has not been opened.
  if (!location.pathname.includes('/pokemon')) return

  const region = regionFromPath(location.pathname)
  if (!region) return

  const first = region.sections
    .flatMap((section) => section.entries)
    .slice(0, FIRST_SCREEN)

  const quiet = () => {
    // Offline, or the dex loader will retry and report it properly. A warm-up
    // must never surface an error of its own.
  }

  for (const entry of first) {
    // `fetch` rather than <link rel=preload>: a preload hint warms the HTTP
    // cache but is a separate request from the app's, so the same URL would be
    // fetched twice — once by the hint and once by `loadPokemon`.
    void fetch(`${API}/pokemon/${entry.slug}`, { priority: 'high' }).catch(quiet)

    /*
     * The sprite too, derived from the national number rather than waited for.
     * Normally the sprite URL is only known after /pokemon responds, which puts
     * the image a full round trip behind the data. The number is already in
     * regions.json, and PokeAPI's sprite files are named by it.
     *
     * Skipped for form-suffixed slugs: an alternate form keeps its species'
     * national number but has its own sprite file numbered above 10000, so
     * this shortcut would fetch the wrong picture. Those are rare and simply
     * load the ordinary way.
     */
    if (!SUFFIX_PATTERN.test(entry.slug)) {
      void fetch(`${SPRITES}/${entry.nationalNo}.png`, { mode: 'no-cors' }).catch(quiet)
    }
  }
}
