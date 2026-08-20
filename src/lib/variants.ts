/**
 * Alternate forms are excluded by default: their slugs 404 on /pokemon-species
 * and their ids sit above 10000, breaking dex numbering and the detail view.
 * Listing one here makes it deliberate.
 *
 * Deliberately one list for both the build script (allowlist) and the app
 * (strips the suffix for display), so a form cannot be buildable but
 * unrenderable. Most are just PokeAPI's name for a species' only ordinary
 * version; `marowak-alola` is the one real regional-form choice.
 */
export const ALLOWED_VARIANTS = [
  'lycanroc-midday',
  'basculin-red-striped',
  'basculegion-male',
  'pumpkaboo-average',
  'gourgeist-average',
  'mimikyu-disguised',
  'oricorio-baile',
  'toxtricity-amped',
  'marowak-alola',
] as const

/** Longest first, so `-red-striped` is tried before a shorter suffix inside it. */
const FORM_SUFFIXES = [
  ...new Set(ALLOWED_VARIANTS.map((slug) => slug.slice(slug.indexOf('-') + 1))),
].sort((a, b) => b.length - a.length)

export const SUFFIX_PATTERN = new RegExp(`-(${FORM_SUFFIXES.join('|')})$`)
