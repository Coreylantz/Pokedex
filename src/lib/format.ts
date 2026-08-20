/** Kept apart from `pokeapi.ts` so rendering a number does not pull in an HTTP client. */
import { SUFFIX_PATTERN } from './variants'
import type { DexEntry, Pokemon, Region, Section } from './types'

/** `lycanroc-midday` -> `lycanroc`. */
export const speciesName = (slug: string): string => slug.replace(SUFFIX_PATTERN, '')

/** 001, 025, 251 — as the games pad them. */
export const dexNumber = (n: number): string => String(n).padStart(3, '0')

export const pad2 = (n: number): string => String(n).padStart(2, '0')

export function titleCase(slug: string): string {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export const monName = (entry: DexEntry, mon: Pokemon | undefined): string =>
  mon?.displayName ?? titleCase(entry.slug)

export const spriteFor = (mon: Pokemon | undefined, shiny: boolean): string | null | undefined =>
  shiny ? mon?.spriteShiny : mon?.sprite

export const idSafe = (value: string): string => value.replace(/\W+/g, '')

export function dexRange(section: Section) {
  // A generator bug, not a runtime state, so assert rather than thread an
  // impossible null through the UI.
  const first = section.entries[0]
  const last = section.entries.at(-1)
  if (!first || !last) throw new Error(`section "${section.label}" has no entries`)

  return {
    first,
    last,
    label: `Nº ${dexNumber(first.regionalNo)}–${dexNumber(last.regionalNo)}`,
  }
}

/** Dex order, section grouping flattened. */
export const flatEntries = (region: Region): DexEntry[] =>
  region.sections.flatMap((s) => s.entries)
