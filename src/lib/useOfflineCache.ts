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
 * By far the most expensive thing the app does: 330 species over two endpoints
 * each plus up to two sprites apiece, which dwarfs the 130 kB bundle. That is
 * why `lowBandwidth` gates this rather than trimming anything shipped.
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
      // Nothing is durably cached until the controlling worker is active.
      if ('serviceWorker' in navigator) {
        await Promise.race([
          navigator.serviceWorker.ready,
          new Promise((resolve) => setTimeout(resolve, 5000)),
        ])
      }

      const failures = await pooled(
        data.allSlugs,
        async (slug) => {
          const mon = await loadPokemon(slug)
          // The shiny needs a toggle turned on to ever be seen, so a
          // data-saving download skips it.
          const wanted = lowBandwidth ? [mon.sprite] : [mon.sprite, mon.spriteShiny]
          const sprites = await Promise.all(
            wanted
              .filter((url): url is string => Boolean(url))
              .map((url) => fetch(url, { mode: 'cors' })),
          )
          if (sprites.some((res) => !res.ok)) throw new Error(`sprite fetch failed for ${slug}`)
        },
        {
          // Stay out of the way of whatever else a metered device is doing.
          limit: lowBandwidth ? 4 : CONCURRENCY,
          onSettled: () => setDone((n) => n + 1),
        },
      )

      // A partial download must not be remembered as complete.
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
   * There is deliberately no automatic prime. Doing it on first visit measured
   * ~4 MB over ~1,320 requests against somebody else's free API, before the
   * reader opened a single entry. The SW's cache-first routes already keep
   * whatever you actually open, so this stays one button in Settings.
   * See scripts/runtime-cost.ts.
   */

  return { status, done, total, online, prime, lowBandwidth }
}
