/**
 * Type-balance diagnostics for the two regional dexes.
 *
 * A regional dex is not just a themed list — it is the pool a player builds a
 * team from and the pool a designer builds gyms from. This checks the things
 * that actually break when a pool is lopsided:
 *
 *   1. Representation      — is any type missing or too thin to build with?
 *   2. Offensive coverage  — can the player hit all 18 types super-effectively
 *                            with something catchable in the region?
 *   3. Defensive exposure  — is the region trivially swept by one attacking
 *                            type, because too much of it shares a weakness?
 *   4. Early availability  — is the variety there before the endgame, or does
 *                            it all arrive at the top of the dex?
 *
 * Counting is per evolution LINE, not per species: three stages of one line is
 * one design decision, and counting stages would triple-weight long lines.
 *
 * Run with: npm run diagnose
 */
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import type { RegionData } from '../src/lib/types.ts'

const here = dirname(fileURLToPath(import.meta.url))
const data = JSON.parse(
  await readFile(resolve(here, '..', 'src', 'data', 'regions.json'), 'utf8'),
) as RegionData

const TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison',
  'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark',
  'steel', 'fairy',
]

// One request per type gives both the full membership of that type across the
// national dex and the authoritative damage chart — no hand-typed matchups.
interface TypePayload {
  pokemon: { pokemon: { name: string; url: string } }[]
  damage_relations: {
    double_damage_to: { name: string }[]
    half_damage_to: { name: string }[]
    no_damage_to: { name: string }[]
  }
}
interface Relations { double: string[]; half: string[]; zero: string[] }

const typeData = new Map<string, TypePayload>()
await Promise.all(
  TYPES.map(async (type) => {
    const res = await fetch(`https://pokeapi.co/api/v2/type/${type}`)
    if (!res.ok) throw new Error(`type fetch failed for ${type}: ${res.status}`)
    typeData.set(type, (await res.json()) as TypePayload)
  }),
)

/** slug -> [types]; built by inverting the per-type membership lists. */
const typesOf = new Map<string, string[]>()
for (const [type, payload] of typeData) {
  for (const { pokemon } of payload.pokemon) {
    const id = Number(pokemon.url.match(/\/(\d+)\/$/)?.[1])
    if (id >= 10000) continue // alternate forms
    if (!typesOf.has(pokemon.name)) typesOf.set(pokemon.name, [])
    typesOf.get(pokemon.name)?.push(type)
  }
}

/** attacking type -> { double, half, zero } */
const chart = new Map<string, Relations>(
  [...typeData].map(([type, d]): [string, Relations] => [
    type,
    {
      double: d.damage_relations.double_damage_to.map((t) => t.name),
      half: d.damage_relations.half_damage_to.map((t) => t.name),
      zero: d.damage_relations.no_damage_to.map((t) => t.name),
    },
  ]),
)

/** Damage multiplier of one attacking type against a defending type pair. */
function multiplier(attack: string, defenders: string[]): number {
  let m = 1
  for (const def of defenders) {
    const rel = chart.get(attack)
    if (!rel) continue
    if (rel.zero.includes(def)) return 0
    if (rel.double.includes(def)) m *= 2
    else if (rel.half.includes(def)) m *= 0.5
  }
  return m
}

/** National-dex baseline share of each type, to compare a region against. */
const nationalLines = [...typesOf.values()]
const nationalShare: Record<string, number> = Object.fromEntries(
  TYPES.map((t) => [t, nationalLines.filter((ts) => ts.includes(t)).length / nationalLines.length]),
)

const bar = (n: number, max: number, width = 26) => '█'.repeat(Math.round((n / max) * width)) || '·'

/**
 * Numbers like "47% exposure" mean nothing on their own, so the same metrics
 * are computed over real shipped regional dexes as a control. Comparison is
 * per species rather than per line, because grouping the control dexes into
 * evolution lines would cost hundreds of extra requests for no extra insight —
 * and the same measure is applied to our regions for the comparison.
 */
const CONTROLS = [
  'kanto', 'original-johto', 'hoenn', 'original-sinnoh',
  'original-unova', 'kalos-central', 'galar', 'paldea',
]

function profile(speciesTypes: string[][]) {
  const n = speciesTypes.length
  const share: Record<string, number> = Object.fromEntries(
    TYPES.map((t) => [t, speciesTypes.filter((ts) => ts.includes(t)).length / n]),
  )
  const exposure: Record<string, number> = Object.fromEntries(
    TYPES.map((atk) => [
      atk,
      speciesTypes.filter((ts) => multiplier(atk, ts) > 1).length / n,
    ]),
  )
  const topType = TYPES.reduce((a, b) => ((share[a] ?? 0) >= (share[b] ?? 0) ? a : b))
  const topAtk = TYPES.reduce((a, b) => ((exposure[a] ?? 0) >= (exposure[b] ?? 0) ? a : b))
  return { n, share, exposure, topType, topAtk }
}

const controlProfiles: (ReturnType<typeof profile> & { name: string })[] = []
for (const name of CONTROLS) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokedex/${name}`)
  if (!res.ok) continue
  const dex = (await res.json()) as { pokemon_entries: { pokemon_species: { name: string } }[] }
  const members = dex.pokemon_entries
    .map((e) => typesOf.get(e.pokemon_species.name))
    .filter((types): types is string[] => Boolean(types))
  controlProfiles.push({ name, ...profile(members) })
}

for (const region of data.regions) {
  const entries = region.sections.flatMap((s) => s.entries)

  // Collapse to one record per evolution line, keeping the FINAL stage's types
  // (that is what a built team actually fields) and the line's dex position.
  interface Line { head: string; firstNo: number; finalTypes: string[]; finalSlug: string }
  const lines = new Map<string, Line>()
  for (const entry of entries) {
    const types = typesOf.get(entry.slug) ?? []
    const prev = lines.get(entry.lineHead)
    lines.set(entry.lineHead, {
      head: entry.lineHead,
      firstNo: prev?.firstNo ?? entry.regionalNo,
      finalTypes: types,
      finalSlug: entry.slug,
    })
  }
  const pool = [...lines.values()]

  console.log(`\n${'='.repeat(72)}\n${region.name.toUpperCase()} — ${pool.length} lines, ${entries.length} species\n${'='.repeat(72)}`)

  // ---- 1. Representation -------------------------------------------------
  const count: Record<string, number> = Object.fromEntries(
    TYPES.map((t) => [t, pool.filter((l) => l.finalTypes.includes(t)).length]),
  )
  const ranked = TYPES.slice().sort((a, b) => (count[b] ?? 0) - (count[a] ?? 0))
  const max = count[ranked[0] ?? ''] ?? 1

  console.log('\n-- Representation (lines with this type, final stage) --')
  console.log('type        n   share  national  skew   ' )
  for (const t of ranked) {
    const n = count[t] ?? 0
    const share = n / pool.length
    const national = nationalShare[t] ?? 0
    const skew = national ? share / national : 0
    const flag = n === 0 ? '  ABSENT' : n < 3 ? '  thin' : skew >= 2 ? '  OVER' : ''
    console.log(
      `${t.padEnd(10)} ${String(n).padStart(2)}  ${(share * 100).toFixed(1).padStart(5)}%  ` +
        `${(national * 100).toFixed(1).padStart(5)}%  ${skew.toFixed(2).padStart(5)}x ${bar(n, max)}${flag}`,
    )
  }

  // ---- 2. Offensive coverage --------------------------------------------
  // For each defending type, how many lines in the pool hold a STAB move type
  // that hits it for 2x or better.
  console.log('\n-- Offensive coverage: lines that can hit each type super-effectively (by STAB) --')
  const holes: string[] = []
  for (const def of TYPES) {
    const answers = pool.filter((l) =>
      l.finalTypes.some((atk: string) => multiplier(atk, [def]) > 1),
    )
    if (answers.length === 0) holes.push(def)
    const label = answers.length === 0 ? '  NO ANSWER' : answers.length < 3 ? '  thin' : ''
    console.log(
      `vs ${def.padEnd(10)} ${String(answers.length).padStart(2)} lines${label}`,
    )
  }

  // ---- 3. Defensive exposure --------------------------------------------
  // If one attacking type shreds a large share of the pool, the region is a
  // pushover for anyone who brings it.
  console.log('\n-- Defensive exposure: share of the pool each attacking type beats --')
  const exposure = TYPES.map((atk) => {
    const hit = pool.filter((l) => multiplier(atk, l.finalTypes) > 1).length
    const resist = pool.filter((l) => multiplier(atk, l.finalTypes) < 1).length
    return { atk, hit, resist, share: hit / pool.length }
  }).sort((a, b) => b.share - a.share)
  const worst = exposure[0] ?? { atk: 'none', hit: 0, resist: 0, share: 0 }

  for (const e of exposure.slice(0, 6)) {
    console.log(
      `${e.atk.padEnd(10)} beats ${String(e.hit).padStart(3)} (${(e.share * 100).toFixed(0).padStart(2)}%)  ` +
        `resisted by ${String(e.resist).padStart(3)} ${bar(e.hit, worst.hit)}`,
    )
  }
  console.log('  ...')
  for (const e of exposure.slice(-3)) {
    console.log(
      `${e.atk.padEnd(10)} beats ${String(e.hit).padStart(3)} (${(e.share * 100).toFixed(0).padStart(2)}%)  ` +
        `resisted by ${String(e.resist).padStart(3)}`,
    )
  }

  // ---- 4. Early availability --------------------------------------------
  // Types a player cannot obtain in the first third of the dex.
  const third = Math.round(pool.length / 3)
  const early = pool.slice().sort((a, b) => a.firstNo - b.firstNo).slice(0, third)
  const earlyTypes = new Set(early.flatMap((l) => l.finalTypes))
  const lateOnly = TYPES.filter((t) => (count[t] ?? 0) > 0 && !earlyTypes.has(t))
  console.log(`\n-- Early game: types unavailable in the first ${third} lines --`)
  console.log(lateOnly.length ? lateOnly.join(', ') : 'none — every represented type is reachable early')

  // ---- verdict -----------------------------------------------------------
  const absent = TYPES.filter((t) => (count[t] ?? 0) === 0)
  const thin = TYPES.filter((t) => (count[t] ?? 0) > 0 && (count[t] ?? 0) < 3)
  console.log('\n-- Summary --')
  console.log(`absent types:        ${absent.length ? absent.join(', ') : 'none'}`)
  console.log(`thin types (<3):     ${thin.length ? thin.join(', ') : 'none'}`)
  console.log(`coverage holes:      ${holes.length ? holes.join(', ') : 'none'}`)
  console.log(`worst exposure:      ${worst.atk} beats ${(worst.share * 100).toFixed(0)}% of the pool`)

  // ---- 5. Against shipped regional dexes ---------------------------------
  const mine = profile(entries.map((e) => typesOf.get(e.slug) ?? []))
  const rows = [
    ...controlProfiles.map((c) => ({ ...c, tag: '' })),
    { ...mine, name: region.name.toLowerCase(), tag: '  <-- this dex' },
  ].sort((a, b) => (a.share[a.topType] ?? 0) - (b.share[b.topType] ?? 0))

  console.log('\n-- Control: the same measures on real shipped regional dexes --')
  console.log('dex                n   most common type      worst exposure')
  for (const r of rows) {
    console.log(
      `${r.name.padEnd(17)} ${String(r.n).padStart(3)}  ` +
        `${r.topType.padEnd(9)} ${((r.share[r.topType] ?? 0) * 100).toFixed(0).padStart(3)}%      ` +
        `${r.topAtk.padEnd(9)} ${((r.exposure[r.topAtk] ?? 0) * 100).toFixed(0).padStart(3)}%${r.tag}`,
    )
  }

  // Ice called out by name: it was the type this whole diagnostic was built to
  // adjudicate, and the shipped-dex maximum is the only meaningful ceiling.
  const myIce = mine.share.ice ?? 0
  const shippedIce = controlProfiles.map((p) => p.share.ice ?? 0).sort((a, b) => b - a)
  console.log(
    `\nice share here ${(myIce * 100).toFixed(1)}%  |  ` +
      `highest in a shipped dex ${((shippedIce[0] ?? 0) * 100).toFixed(1)}%  |  ` +
      `national ${((nationalShare.ice ?? 0) * 100).toFixed(1)}%`,
  )
}
