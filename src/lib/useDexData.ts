import { useEffect, useRef, useState } from 'react'
import { loadPokemon } from './pokeapi'
import { pooled } from './pool'
import type { Pokemon } from './types'

const CONCURRENCY = 8

/**
 * `failed` is part of the contract, not diagnostics: callers need
 * `loaded + failed` to know the pass has settled, because `loaded` alone never
 * reaches `total` when anything 404s.
 */
export function useDexData(slugs: readonly string[]) {
  const [byslug, setBySlug] = useState<ReadonlyMap<string, Pokemon>>(() => new Map())
  const [loaded, setLoaded] = useState(0)
  /**
   * Which slugs failed, not just how many: an entry page must tell "not arrived
   * yet" from "not coming" — a spinner versus an error screen.
   */
  const [failedSlugs, setFailedSlugs] = useState<ReadonlySet<string>>(() => new Set())

  /**
   * Arrivals batch here and publish once per frame. One state update per
   * species meant 158 renders of a 158-card grid: 14% of frames dropped and a
   * 283 ms worst frame. See scripts/scroll-jank.ts.
   */
  const pending = useRef<Map<string, Pokemon>>(new Map())
  const frame = useRef<number | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    setLoaded(0)
    setFailedSlugs(new Set())
    setBySlug(new Map())
    pending.current = new Map()

    const publish = () => {
      frame.current = undefined
      if (cancelled || pending.current.size === 0) return
      const arrived = pending.current
      pending.current = new Map()
      setBySlug((prev) => {
        const next = new Map(prev)
        for (const [slug, mon] of arrived) next.set(slug, mon)
        return next
      })
    }

    void pooled(
      slugs,
      async (slug) => {
        const mon = await loadPokemon(slug)
        if (cancelled) return
        pending.current.set(slug, mon)
        // rAF rather than a timer: one render per painted frame, and it
        // pauses entirely on a hidden tab.
        frame.current ??= requestAnimationFrame(publish)
      },
      {
        limit: CONCURRENCY,
        cancelled: () => cancelled,
        onSettled: (slug, ok) => {
          if (ok) setLoaded((n) => n + 1)
          else setFailedSlugs((prev) => new Set(prev).add(slug))
        },
      },
    ).then(() => {
      // The last few arrivals may land after the final frame was scheduled.
      if (!cancelled) publish()
    })

    return () => {
      cancelled = true
      if (frame.current !== undefined) cancelAnimationFrame(frame.current)
      frame.current = undefined
    }
  }, [slugs])

  return { byslug, loaded, failedSlugs, failed: failedSlugs.size, total: slugs.length }
}
