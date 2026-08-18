/**
 * Shared shapes.
 *
 * Types-only module: it emits nothing at runtime. Everything here describes
 * either the generated dex data (`src/data/regions.json`, written by
 * `scripts/build-dex.ts`) or the flattened view of PokeAPI the UI actually
 * consumes.
 */

/** One dex entry. */
export interface DexEntry {
  regionalNo: number
  /** National number; a regional form keeps its species'. */
  nationalNo: number
  /** PokeAPI slug, which for some default forms carries a suffix. */
  slug: string
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
  professor: string
  skin: Skin
  count: number
  sections: Section[]
}

export interface RegionData {
  regions: Region[]
  allSlugs: string[]
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
}

/** The three voices `useFeedback` can play. */
export type Voice = 'move' | 'select' | 'back'

/** Progress of the offline priming pass. */
export type PrimeStatus = 'idle' | 'priming' | 'ready' | 'error'
