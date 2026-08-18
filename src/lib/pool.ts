interface PoolOptions<T> {
  /** Parallel lanes. Defaults to 8. */
  limit?: number
  onSettled?: (item: T, ok: boolean) => void
  /** Checked between items so a caller can abandon a run early. */
  cancelled?: () => boolean
}

/**
 * Runs `worker` over `items` with a fixed number of parallel lanes.
 *
 * Both the dex loader and the offline prime need exactly this, and had grown
 * their own copies. Returns the failure count so a caller can tell a complete
 * pass from a partial one — the offline prime depends on that distinction to
 * avoid recording an incomplete download as ready.
 *
 * @returns how many items failed
 */
export async function pooled<T>(
  items: readonly T[],
  worker: (item: T) => Promise<unknown>,
  options: PoolOptions<T> = {},
): Promise<number> {
  const { limit = 8, onSettled, cancelled } = options
  let cursor = 0
  let failures = 0

  const lanes = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      if (cancelled?.()) return
      // `noUncheckedIndexedAccess` is right to flag this in general, but the
      // loop condition has already established the index is in range.
      const item = items[cursor++] as T
      let ok = true
      try {
        await worker(item)
      } catch {
        // One bad item must not abandon the rest; the caller decides what a
        // non-zero failure count means.
        ok = false
        failures++
      }
      if (!cancelled?.()) onSettled?.(item, ok)
    }
  })

  await Promise.all(lanes)
  return failures
}
