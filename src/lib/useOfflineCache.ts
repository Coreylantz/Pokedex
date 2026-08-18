import { useCallback, useEffect, useRef, useState } from 'react'
import { loadPokemon } from './pokeapi'
import { pooled } from './pool'
import regionData from '../data/regions.json'
import type { PrimeStatus, RegionData } from './types'

/** Bump the version when the dex lists change, so returning users re-prime. */
const PRIME_KEY = 'twindex:primed:v2'

const CONCURRENCY = 12

/** JSON imports widen unions to `string`; the generator guarantees the shape. */
const data = regionData as unknown as RegionData

/**
 * Warms the service worker caches with every species in both dexes so the app
 * is genuinely usable offline — not just the pages you happened to visit.
 *
 * This is by far the most expensive thing the app does: 330 species over two
 * endpoints each, plus up to two sprites apiece. On a capped connection that
 * is the whole story, and the 130 kB of app around it is a rounding error — so
 * `lowBandwidth` gates it rather than trimming anything in the bundle.
 */
export function useOfflineCache({ lowBandwidth = false } = {}) {
  const [status, setStatus] = useState<PrimeStatus>(() =>
    localStorage.getItem(PRIME_KEY) ? 'ready' : 'idle',
  )
  const [done, setDone] = useState(0)
  const [online, setOnline] = useState(() => navigator.onLine)
  const running = useRef(false)

  const total = data.allSlugs.length

  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    addEventListener('online', update)
    addEventListener('offline', update)
    return () => {
      removeEventListener('online', update)
      removeEventListener('offline', update)
    }
  }, [])

  const prime = useCallback(async () => {
    if (running.current || !navigator.onLine) return
    running.current = true
    setDone(0)
    setStatus('priming')

    try {
      // Nothing is durably cached until the worker controlling this page is
      // active, so wait for it before spending requests.
      if ('serviceWorker' in navigator) {
        await Promise.race([
          navigator.serviceWorker.ready,
          new Promise((resolve) => setTimeout(resolve, 5000)),
        ])
      }

      // A single failed species must not abandon the download; the runtime
      // cache picks it up next time it is viewed online.
      const failures = await pooled(
        data.allSlugs,
        async (slug) => {
          const mon = await loadPokemon(slug)
          // Pull the sprites through the SW too. The shiny is the one sprite a
          // reader may never look at — it needs the Shiny toggle turned on — so
          // a data-saving download skips it. Worth doing, but keep it in
          // proportion: sprites are only ~14% of the total, and the shiny half
          // of that. The JSON is the expensive part and cannot be trimmed,
          // because PokeAPI has no way to ask for fewer fields.
          const wanted = lowBandwidth ? [mon.sprite] : [mon.sprite, mon.spriteShiny]
          const sprites = await Promise.all(
            wanted
              .filter((url): url is string => Boolean(url))
              .map((url) => fetch(url, { mode: 'cors' })),
          )
          if (sprites.some((res) => !res.ok)) throw new Error(`sprite fetch failed for ${slug}`)
        },
        {
          // Fewer lanes on a metered connection: the point is to stay out of
          // the way of whatever else the device is doing.
          limit: lowBandwidth ? 4 : CONCURRENCY,
          onSettled: () => setDone((n) => n + 1),
        },
      )

      // Only claim the dex is offline-ready when every species actually landed;
      // a partial download must not be remembered as complete.
      if (failures > 0) {
        setStatus('error')
        return
      }
      localStorage.setItem(PRIME_KEY, new Date().toISOString())
      setStatus('ready')
    } catch {
      setStatus('error')
    } finally {
      running.current = false
    }
  }, [lowBandwidth])

  /*
   * There is deliberately no automatic prime.
   *
   * This used to download the whole dex on the first online visit. Measured,
   * that is ~4 MB across ~1,320 requests — thirty times the app itself — spent
   * before the reader has opened a single entry, and against somebody else's
   * free API. Most visits look at a handful of species, so most of it was
   * waste, and on a metered connection it was waste the reader paid for.
   *
   * What replaces it costs nothing: the service worker's cache-first routes
   * already keep every species and sprite you actually open, so browsing the
   * dex builds an offline copy of the parts you use. Wanting the *whole* thing
   * offline is a real intent, so it stays one button in Settings — declared
   * rather than assumed.
   *
   * See scripts/runtime-cost.ts for the measurement.
   */

  return { status, done, total, online, prime, lowBandwidth }
}
