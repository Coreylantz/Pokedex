/**
 * Display formatting. Kept apart from `pokeapi.ts` so components that only
 * need to render a number are not importing an HTTP client to get it.
 */
import { SUFFIX_PATTERN } from './variants'
import type { DexEntry, Pokemon, Region, Section } from './types'

/** `lycanroc-midday` -> `lycanroc`. */
export const speciesName = (slug: string): string => slug.replace(SUFFIX_PATTERN, '')

/** Pads a dex number the way the games do: 001, 025, 251. */
export const dexNumber = (n: number): string => String(n).padStart(3, '0')

/** Two digits, for ordinals that are not dex numbers. */
export const pad2 = (n: number): string => String(n).padStart(2, '0')

export function titleCase(slug: string): string {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

/** The name to show before the species record has arrived, and after. */
export const monName = (entry: DexEntry, mon: Pokemon | undefined): string =>
  mon?.displayName ?? titleCase(entry.slug)

export const spriteFor = (mon: Pokemon | undefined, shiny: boolean): string | null | undefined =>
  shiny ? mon?.spriteShiny : mon?.sprite

/** Strips a string down to something usable as an element id. */
export const idSafe = (value: string): string => value.replace(/\W+/g, '')

/** The dex-number span a section covers. */
export function dexRange(section: Section) {
  // A section with no entries would be a generator bug, not a runtime state,
  // so this asserts rather than threading an impossible null through the UI.
  const first = section.entries[0]
  const last = section.entries.at(-1)
  if (!first || !last) throw new Error(`section "${section.label}" has no entries`)

  return {
    first,
    last,
    label: `Nº ${dexNumber(first.regionalNo)}–${dexNumber(last.regionalNo)}`,
  }
}

/** Every entry in a region, in dex order, with the section grouping flattened. */
export const flatEntries = (region: Region): DexEntry[] =>
  region.sections.flatMap((s) => s.entries)
