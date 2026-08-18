/**
 * The shapes the generator works with.
 *
 * These are the *input* side, deliberately separate from `src/lib/types.ts`,
 * which describes the *output*. A hand-authored section lists species slugs;
 * the generated one holds numbered entries with resolved dex numbers. They
 * are different shapes and conflating them is how the numbering used to end up
 * hand-typed.
 */
export interface SourceSection {
  label: string
  note: string
  /** PokeAPI slugs, in dex order. */
  species: string[]
}

export interface SourceRegion {
  id: string
  name: string
  tagline: string
  blurb: string
  professor: string
  skin: 'gen1' | 'gen2'
  sections: SourceSection[]
}

/** What `resolveSpecies` gets back from the API for one slug. */
export interface Resolved {
  name: string
  nationalNo: number
  /** Evolution-chain URL, used to group a line under one head. */
  chain: string
}

/** An entry mid-build: numbered, before its national number is resolved. */
export interface DraftEntry {
  regionalNo: number
  slug: string
  nationalNo?: number
}
