/**
 * Directional focus movement for the screen.
 *
 * Both the keyboard arrows and the on-device D-pad route through here, so the
 * plastic buttons do exactly what the real keys do rather than being a second,
 * subtly different implementation.
 */
export type Direction = 'up' | 'down' | 'left' | 'right'

const FOCUSABLE =
  'a[href], button:not(:disabled), input:not(:disabled), select, textarea, [tabindex]:not([tabindex="-1"])'

function focusableIn(root: Element): HTMLElement[] {
  // Collapsed panels are unmounted rather than hidden, so presence in the DOM
  // is enough — and unlike offsetParent this does not depend on layout, which
  // keeps it testable.
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) => !el.closest('[hidden], [aria-hidden="true"]'),
  )
}

/**
 * How many items sit on one row of the dex grid, read off the resolved
 * template rather than guessed, so it stays correct at every breakpoint.
 */
function gridColumns(el: Element | undefined): number {
  const grid = el?.closest('.dex-grid')
  if (!grid) return 1
  return getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length
}

/** Moves focus within `root`. Returns true if it handled the movement. */
export function moveFocus(root: Element | null, direction: Direction): boolean {
  if (!root) return false
  const items = focusableIn(root)
  const first = items[0]
  if (!first) return false

  const current = items.indexOf(document.activeElement as HTMLElement)
  if (current === -1) {
    first.focus()
    return true
  }

  // Up and down step a whole row inside the grid, and one item everywhere else.
  const step = direction === 'up' || direction === 'down' ? gridColumns(items[current]) : 1
  const delta = direction === 'up' || direction === 'left' ? -step : step

  const next = Math.min(items.length - 1, Math.max(0, current + delta))
  if (next === current) return false

  const target = items[next]
  if (!target) return false
  target.focus()
  // Not implemented in every environment, and a nicety rather than a necessity.
  target.scrollIntoView?.({ block: 'nearest' })
  return true
}

/** True when the event came from somewhere that needs the arrow keys itself. */
export function isTextEntry(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('input, textarea, select'))
}
