/**
 * These throw rather than returning null, which is both what a test wants and a
 * better failure: "no .menu__title in container" names the missing element,
 * where `Cannot read properties of null` names whatever touched it.
 */

/** In a test an index is a premise, so state it once rather than sprinkling `!`. */
export function must<T>(value: T | null | undefined, what: string): T {
  if (value === null || value === undefined) throw new Error(`expected ${what} to exist`)
  return value
}

export function q<T extends Element = HTMLElement>(root: ParentNode, selector: string): T {
  const el = root.querySelector<T>(selector)
  if (!el) throw new Error(`no ${selector} in container`)
  return el
}

export function qa<T extends Element = HTMLElement>(root: ParentNode, selector: string): T[] {
  return [...root.querySelectorAll<T>(selector)]
}

export function text(root: ParentNode, selector: string): string {
  return q(root, selector).textContent ?? ''
}

/** Keeps `qa(...)[0]` and its optional index out of the tests. */
export function nth<T extends Element = HTMLElement>(
  root: ParentNode,
  selector: string,
  index: number,
): T {
  const el = qa<T>(root, selector)[index]
  if (!el) throw new Error(`no ${selector} at index ${index} in container`)
  return el
}
