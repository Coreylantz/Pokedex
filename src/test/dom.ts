/**
 * Query helpers for the tests.
 *
 * `querySelector` returns `Element | null`, so under a strict compiler every
 * assertion would need a `!`. These throw instead, which is both what the test
 * wants and a better failure: "no .menu__title in container" points at the
 * missing element, where `Cannot read properties of null` points at the line
 * that happened to touch it.
 */

/**
 * Asserts a value the fixtures guarantee. Under `noUncheckedIndexedAccess`
 * every `array[0]` is optional; in a test that index is a premise, so this
 * states it once and fails loudly rather than sprinkling `!` around.
 */
export function must<T>(value: T | null | undefined, what: string): T {
  if (value === null || value === undefined) throw new Error(`expected ${what} to exist`)
  return value
}

/** The one matching element, or a thrown error naming the selector. */
export function q<T extends Element = HTMLElement>(root: ParentNode, selector: string): T {
  const el = root.querySelector<T>(selector)
  if (!el) throw new Error(`no ${selector} in container`)
  return el
}

/** Every match, as a real array. */
export function qa<T extends Element = HTMLElement>(root: ParentNode, selector: string): T[] {
  return [...root.querySelectorAll<T>(selector)]
}

/** Trimmed text of the one matching element. */
export function text(root: ParentNode, selector: string): string {
  return q(root, selector).textContent ?? ''
}

/** The match at `index`, or a thrown error. Keeps `qa(...)[0]` off the tests. */
export function nth<T extends Element = HTMLElement>(
  root: ParentNode,
  selector: string,
  index: number,
): T {
  const el = qa<T>(root, selector)[index]
  if (!el) throw new Error(`no ${selector} at index ${index} in container`)
  return el
}
