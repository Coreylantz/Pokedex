import { useEffect, useRef, useState } from 'react'
import { loadPokemon } from './pokeapi'
import { pooled } from './pool'
import type { Pokemon } from './types'

const CONCURRENCY = 8

/**
 * Loads every species in a region, streaming results in as they arrive so the
 * grid fills progressively instead of blocking on the slowest request.
 * Species already fetched by the offline prime resolve from memory instantly.
 *
 * `failed` is part of the contract, not diagnostics: callers need
 * `loaded + failed` to know the pass has settled, because `loaded` alone never
 * reaches `total` when anything 404s.
 */
export function useDexData(slugs: readonly string[]) {
  const [byslug, setBySlug] = useState<ReadonlyMap<string, Pokemon>>(() => new Map())
  const [loaded, setLoaded] = useState(0)
  /**
   * Which slugs failed, not just how many.
   *
   * A count is enough for the list, which only reports a total. An entry page
   * needs to tell "this species has not arrived yet" from "this species is not
   * coming", because those are a spinner and an error screen respectively —
   * and without the distinction a failed entry shows "Loading…" forever.
   */
  const [failedSlugs, setFailedSlugs] = useState<ReadonlySet<string>>(() => new Set())

  /**
   * Arrivals are collected here and published once per frame rather than one
   * state update per species.
   *
   * Setting state per arrival meant 158 renders of a 158-card grid during the
   * load — measurably 14% of frames dropped and a 283 ms worst frame while
   * scrolling, because each update also re-ran the type and filter passes over
   * the whole list. Batching turns that into roughly one render per frame. See
   * scripts/scroll-jank.ts.
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
        // requestAnimationFrame rather than a timer: it coalesces to exactly
        // one render per painted frame, and pauses entirely on a hidden tab.
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
