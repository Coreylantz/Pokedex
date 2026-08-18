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
 * Decides what one key press means. A module-level function rather than a
 * closure inside the effect: cognitive complexity charges every branch for the
 * functions enclosing it, so the same logic nested two deep scored 18 against
 * a limit of 15 and scores 6 out here.
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
 * The window-level keyboard contract for the device screen.
 *
 * Arrows always move focus, including on an entry page. Paging between Pokemon
 * is what the Prev and Next buttons are for — hijacking the arrows there would
 * break the one navigation model the rest of the app uses.
 *
 * Escape goes back, but only when there is somewhere to go. It is handled here
 * and nowhere else: a second handler on the entry page bubbled into this one
 * and popped two history entries instead of one, which is how you end up two
 * screens away from where you meant to be.
 */
export function useScreenKeys(options: ScreenKeys) {
  /*
   * Deliberately without a dependency array. The handler closes over
   * `canGoBack` and `onBack`, both of which change on every navigation, so
   * re-binding one listener per render is cheaper and far less error-prone
   * than the stale closure the alternative produces.
   */
  useEffect(() => {
    const listener = (event: KeyboardEvent) => handleKey(event, options)
    addEventListener('keydown', listener)
    return () => removeEventListener('keydown', listener)
  })
}
