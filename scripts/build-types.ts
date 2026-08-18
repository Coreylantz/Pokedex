/**
 * The shapes the generator works with.
 *
 * These are the *input* side, deliberately separate from `src/lib/types.ts`,
 * which describes the *output*. A hand-authored section lists species slugs;
 * the generated one holds numbered entries with their reasoning attached. They
 * are different shapes and conflating them is how the numbering used to end up
 * hand-typed.
 */
import type { Criterion } from '../src/lib/types.ts'

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
  etymology: string
  professor: string
  skin: 'gen1' | 'gen2'
  sections: SourceSection[]
}

export interface Rationale {
  tags: Criterion[]
  why: string
}

/** What `resolveSpecies` gets back from the API for one slug. */
export interface Resolved {
  name: string
  nationalNo: number
  /** Evolution-chain URL, used to group a line under one head. */
  chain: string
}

/** An entry mid-build: numbered, but not yet carrying its line's reasoning. */
export interface DraftEntry {
  regionalNo: number
  slug: string
  nationalNo?: number
  lineHead?: string
  why?: string
  tags?: Criterion[]
  score?: number
  variantNote?: string
}
