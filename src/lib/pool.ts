interface PoolOptions<T> {
  /** Parallel lanes. Defaults to 8. */
  limit?: number
  onSettled?: (item: T, ok: boolean) => void
  /** Checked between items so a caller can abandon a run early. */
  cancelled?: () => boolean
}

/**
 * Returns the failure count so a caller can tell a complete pass from a partial
 * one — the offline prime uses that to avoid recording a partial download as
 * ready.
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
      // The loop condition has already established the index is in range.
      const item = items[cursor++] as T
      let ok = true
      try {
        await worker(item)
      } catch {
        // One bad item must not abandon the rest.
        ok = false
        failures++
      }
      if (!cancelled?.()) onSettled?.(item, ok)
    }
  })

  await Promise.all(lanes)
  return failures
}
