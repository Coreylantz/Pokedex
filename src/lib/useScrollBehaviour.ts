import { useEffect, useRef, useState, type RefObject } from 'react'

/**
 * Remembers where the list was scrolled to, and what was focused, across a
 * trip into an entry and back.
 *
 * Without this, coming back from an entry drops you at the top of a
 * 158-item grid with focus on the document — which for a keyboard or screen
 * reader user means starting the whole list again. Restoring both the scroll
 * position and the card you left from is what makes back feel like back.
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

    // CSS.escape because a slug can contain characters a selector would
    // otherwise read as syntax.
    screen.querySelector<HTMLElement>(`[data-slug="${CSS.escape(slug)}"]`)?.focus()
    returnTo.current = null
  }, [screenRef, selected])

  return { listScroll, returnTo }
}

/**
 * True once the reader has genuinely reached the end of a long list.
 *
 * The dex runs to well over a hundred entries, so a way back to the top earns
 * its place — but only at the bottom, and only when the list is long enough
 * for that to have meant something.
 */
export function useAtBottom(
  screenRef: RefObject<HTMLElement | null>,
  deps: readonly unknown[],
): boolean {
  const [atBottom, setAtBottom] = useState(false)

  useEffect(() => {
    const screen = screenRef.current
    if (!screen) return

    /*
     * Coalesced to one measurement per frame. The three reads below are all
     * layout properties, so running them on every scroll event forces a
     * synchronous reflow several times per frame — and `content-visibility` on
     * the cards makes `scrollHeight` more expensive to answer, not less.
     */
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
