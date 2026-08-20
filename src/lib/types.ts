/**
 * Describes the generated dex data (`src/data/regions.json`, from
 * `scripts/build-dex.ts`) and the flattened view of PokeAPI the UI consumes.
 */

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

interface Stat {
  name: string
  value: number
}

/** Flattened out of PokeAPI's two endpoints. */
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
  /** Halves what an offline download costs, and skips the shiny sprites. */
  lowBandwidth: boolean
}

export type Page = 'menu' | 'dex' | 'region' | 'area' | 'settings'

export interface Route {
  regionId: string
  page: Page
  mon: string | null
  area: number | null
}

export type Voice = 'move' | 'select' | 'back'

export type PrimeStatus = 'idle' | 'priming' | 'ready' | 'error'
