import { useEffect, useRef, useState, type RefObject } from 'react'

/**
 * Restores scroll *and* focus: without the focus half, back drops a keyboard or
 * screen reader user at the top of a 158-item grid, starting the list again.
 */
export function useScrollRestoration(
  screenRef: RefObject<HTMLElement | null>,
  selected: string | null,
) {
  const listScroll = useRef(0)
  const returnTo = useRef<string | null>(null)

  useEffect(() => {
    const screen = screenRef.current
    if (!screen) return

    // Entering an entry always starts at the top of it.
    if (selected) {
      screen.scrollTop = 0
      return
    }

    screen.scrollTop = listScroll.current
    const slug = returnTo.current
    if (!slug) return

    // A slug can contain characters a selector would read as syntax.
    screen.querySelector<HTMLElement>(`[data-slug="${CSS.escape(slug)}"]`)?.focus()
    returnTo.current = null
  }, [screenRef, selected])

  return { listScroll, returnTo }
}

/** Only at the bottom, and only when the list was long enough to be worth it. */
export function useAtBottom(
  screenRef: RefObject<HTMLElement | null>,
  deps: readonly unknown[],
): boolean {
  const [atBottom, setAtBottom] = useState(false)

  useEffect(() => {
    const screen = screenRef.current
    if (!screen) return

    // One measurement per frame: the reads below are layout properties, and
    // `content-visibility` on the cards makes `scrollHeight` dearer, not cheaper.
    let queued = 0
    const measure = () => {
      queued = 0
      const remaining = screen.scrollHeight - screen.scrollTop - screen.clientHeight
      setAtBottom(screen.scrollHeight > screen.clientHeight + 200 && remaining < 120)
    }
    const onScroll = () => {
      queued ||= requestAnimationFrame(measure)
    }

    measure()
    screen.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      screen.removeEventListener('scroll', onScroll)
      if (queued) cancelAnimationFrame(queued)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenRef, ...deps])

  return atBottom
}
