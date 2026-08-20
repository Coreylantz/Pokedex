import { dexNumber } from './format'
import type { DexEntry, Pokemon } from './types'

/**
 * Every Pokemon type, alphabetically.
 *
 * The filter used to derive its chips from whichever species had arrived so
 * far, which meant the panel gained chips and reflowed while the dex was still
 * loading — the largest layout shift in the app, and one that only showed up
 * on a slow connection where the panel could be opened mid-load.
 *
 * A fixed list is also the more honest model: these eighteen are the domain a
 * reader is choosing from, and which of them happen to have been fetched yet
 * is an implementation detail. Selecting a type absent from a region answers
 * "0 of 158 match", which is a true answer rather than a missing control.
 */
export const ALL_TYPES: readonly string[] = [
  'bug', 'dark', 'dragon', 'electric', 'fairy', 'fighting', 'fire', 'flying',
  'ghost', 'grass', 'ground', 'ice', 'normal', 'poison', 'psychic', 'rock',
  'steel', 'water',
]

/**
 * The dex list's search and type filter.
 *
 * Extracted from the component because it was the single most complex thing in
 * the app — cognitive complexity 37 against a limit of 15, all of it from a
 * predicate nested inside a `filter` inside a `useMemo`. Split into two named
 * checks it is legible, and it can be tested without rendering anything.
 */

/**
 * What a text query is matched against.
 *
 * Both the padded and unpadded numbers are included deliberately: readers type
 * "25" and they type "025", and a dex that only answered one of those would be
 * quietly broken for half of them. The slug is searched as well as the display
 * name so that "nidoran-f" finds a species whose printed name is "Nidoran♀".
 */
function haystack(entry: DexEntry, mon: Pokemon | undefined): string[] {
  return [
    mon?.displayName?.toLowerCase() ?? entry.slug,
    entry.slug,
    dexNumber(entry.regionalNo),
    dexNumber(entry.nationalNo),
    String(entry.regionalNo),
    String(entry.nationalNo),
  ]
}

const matchesQuery = (entry: DexEntry, mon: Pokemon | undefined, query: string): boolean =>
  query === '' || haystack(entry, mon).some((value) => value.includes(query))

/**
 * Every selected type must be present, not merely one of them: picking Water
 * and Flying should narrow to Gyarados, not widen to every bird and every fish.
 *
 * An entry whose species record has not arrived cannot be matched on type, so
 * it is excluded rather than assumed to match — showing it would mean the
 * filter appears to include things it has not checked.
 */
const matchesTypes = (mon: Pokemon | undefined, types: readonly string[]): boolean => {
  if (types.length === 0) return true
  return mon !== undefined && types.every((type) => mon.types.includes(type))
}

export interface DexFilter {
  /** Raw query text; trimmed and lowercased here so callers need not. */
  query: string
  activeTypes: readonly string[]
}

export function filterEntries(
  entries: readonly DexEntry[],
  byslug: ReadonlyMap<string, Pokemon>,
  { query, activeTypes }: DexFilter,
): DexEntry[] {
  const q = query.trim().toLowerCase()
  return entries.filter((entry) => {
    const mon = byslug.get(entry.slug)
    return matchesQuery(entry, mon, q) && matchesTypes(mon, activeTypes)
  })
}

/** True when anything is actually narrowing the list. */
export const isFiltering = ({ query, activeTypes }: DexFilter): boolean =>
  query.trim() !== '' || activeTypes.length > 0
