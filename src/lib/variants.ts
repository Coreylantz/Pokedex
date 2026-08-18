/**
 * The alternate forms this dex is allowed to use.
 *
 * Shared between the build script and the app, which need it for opposite
 * reasons: `scripts/build-dex.ts` treats it as an allowlist and rejects any
 * form-suffixed slug missing from it, while the app strips these suffixes back
 * off for display. Keeping one list means a form can never be buildable but
 * unrenderable, or renderable but unbuildable — which is what happened when
 * the two lists were maintained separately and a stale `-ice` suffix survived
 * in the display half with nothing to match it.
 *
 * Alternate forms are excluded by default because their slugs 404 on
 * /pokemon-species and their ids sit above 10000, which breaks both the dex
 * numbering and the detail view. Listing one here makes it a deliberate choice.
 *
 * Most of these are simply PokeAPI's name for a species' only ordinary
 * version. `marowak-alola` is the real thing: a regional form picked over the
 * standard one, and is the only one where that choice is load-bearing.
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

/**
 * The suffix of each allowed form, longest first so that `-red-striped` is
 * tried before any shorter suffix that could match inside it.
 */
const FORM_SUFFIXES = [
  ...new Set(ALLOWED_VARIANTS.map((slug) => slug.slice(slug.indexOf('-') + 1))),
].sort((a, b) => b.length - a.length)

export const SUFFIX_PATTERN = new RegExp(`-(${FORM_SUFFIXES.join('|')})$`)
