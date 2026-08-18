import { useEffect, useState } from 'react'
import type { Explained } from './types'

/**
 * The reasoning behind every line, loaded only when /explained is open.
 *
 * It is 47 kB of prose for a route nothing links to, so it is a dynamic import
 * rather than part of the entry bundle — Vite emits it as its own chunk and the
 * service worker still precaches it, so it stays available offline without
 * costing every first visit.
 */
export function useExplained(active: boolean): Explained | undefined {
  const [data, setData] = useState<Explained | undefined>(undefined)

  useEffect(() => {
    if (!active || data) return
    let cancelled = false
    void import('../data/explained.json')
      .then((module) => {
        if (!cancelled) setData(module.default as unknown as Explained)
      })
      .catch(() => {
        // Offline before the chunk was cached. The page renders without the
        // notes rather than failing; a reload once online fills them in.
      })
    return () => {
      cancelled = true
    }
  }, [active, data])

  return data
}
