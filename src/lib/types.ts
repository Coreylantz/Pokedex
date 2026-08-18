/**
 * Shared shapes.
 *
 * Types-only module: it emits nothing at runtime. Everything here describes
 * either the generated dex data (`src/data/regions.json`, written by
 * `scripts/build-dex.ts`) or the flattened view of PokeAPI the UI actually
 * consumes.
 */

/** The four grounds on which a line earns its place in a region. */
export type Criterion = 'thematic' | 'fauna' | 'stylistic' | 'mechanics'

/**
 * One dex entry.
 *
 * Deliberately carries no reasoning: that is written per evolution line, so
 * storing it here repeated it once per stage and put 66 kB of text nothing
 * links to into the entry bundle. `lineHead` is the key into `Explained`,
 * which loads only when /explained is opened.
 */
export interface DexEntry {
  regionalNo: number
  /** National number; a regional form keeps its species'. */
  nationalNo: number
  /** PokeAPI slug, which for some default forms carries a suffix. */
  slug: string
  /** Slug of the evolution line's base form. */
  lineHead: string
}

/** Why one evolution line earns its place in its region. */
export interface Rationale {
  why: string
  tags: Criterion[]
}

/** The lazily-loaded companion to the dex: `src/data/explained.json`. */
export interface Explained {
  /** Keyed by line head. */
  lines: Record<string, Rationale>
  /** Keyed by slug — it is the form that was chosen, not the line. */
  variantNotes: Record<string, string>
}

export interface Section {
  label: string
  note: string
  entries: DexEntry[]
}

/** Which Pokedex hardware renders a region. Used by `Region` below. */
type Skin = 'gen1' | 'gen2'

export interface Region {
  id: string
  name: string
  tagline: string
  blurb: string
  etymology: string
  professor: string
  skin: Skin
  count: number
  sections: Section[]
}

export interface CriterionInfo {
  label: string
  blurb: string
}

export interface RegionData {
  regions: Region[]
  allSlugs: string[]
  criteria: Record<Criterion, CriterionInfo>
}

/** One base stat, as `Pokemon.stats` below. */
interface Stat {
  name: string
  value: number
}

/** A species as the UI needs it, flattened out of PokeAPI's two endpoints. */
export interface Pokemon {
  displayName: string
  genus: string
  flavourText: string
  types: string[]
  heightM: number
  weightKg: number
  heightImperial: string
  weightImperial: string
  stats: Stat[]
  sprite: string | null
  spriteShiny: string | null
  /** Null when absent or an empty string upstream. */
  cry: string | null
}

export interface Settings {
  shell: boolean
  scanlines: boolean
  glow: boolean
  transitions: boolean
  sound: boolean
  haptics: boolean
  typeface: 'digital' | 'readable'
  textSize: 'normal' | 'large' | 'largest'
  contrast: boolean
  reduceMotion: boolean
  /**
   * Data saver. Stops the app downloading the whole dex in the background and
   * halves what a download costs when you do ask for one.
   */
  lowBandwidth: boolean
}

export type Page = 'menu' | 'dex' | 'region' | 'area' | 'settings'

export interface Route {
  regionId: string
  page: Page
  mon: string | null
  area: number | null
  explained: boolean
}

/** The three voices `useFeedback` can play. */
export type Voice = 'move' | 'select' | 'back'

/** Progress of the offline priming pass. */
export type PrimeStatus = 'idle' | 'priming' | 'ready' | 'error'
