import { useEffect, type RefObject } from 'react'
import { isTextEntry, moveFocus, type Direction } from './focusNav'
import type { Voice } from './types'

const DIRECTIONS: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

interface ScreenKeys {
  screenRef: RefObject<HTMLElement | null>
  feedback: (voice: Voice) => void
  canGoBack: boolean
  onBack: () => void
}

/**
 * Module-level rather than a closure in the effect: cognitive complexity
 * charges every branch for its enclosing functions, scoring this 18 nested
 * against a limit of 15, and 6 out here.
 */
function handleKey(event: KeyboardEvent, { screenRef, feedback, canGoBack, onBack }: ScreenKeys) {
  // Anything with a modifier belongs to the browser or the OS.
  if (event.altKey || event.ctrlKey || event.metaKey) return
  // A search field needs its own arrows and its own Escape.
  if (isTextEntry(event.target)) return

  const direction = DIRECTIONS[event.key]
  if (direction) {
    if (!moveFocus(screenRef.current, direction)) return
    event.preventDefault()
    feedback('move')
    return
  }

  if (event.key === 'Escape' && canGoBack) {
    event.preventDefault()
    feedback('back')
    onBack()
  }
}

/**
 * Arrows always move focus, even on an entry page; paging is what Prev and Next
 * are for. Escape is handled here and nowhere else — a second handler on the
 * entry page bubbled into this one and popped two history entries.
 */
export function useScreenKeys(options: ScreenKeys) {
  // Deliberately no dependency array: the handler closes over values that
  // change on every navigation, and re-binding one listener beats a stale
  // closure.
  useEffect(() => {
    const listener = (event: KeyboardEvent) => handleKey(event, options)
    addEventListener('keydown', listener)
    return () => removeEventListener('keydown', listener)
  })
}
