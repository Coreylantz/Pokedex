/**
 * Emits `src/data/regions.json` from the lists in `scripts/region-lists.ts`,
 * resolving every slug against PokeAPI so dex numbers are never hand-typed.
 *
 * Run with: npm run build:dex
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { REGIONS } from './region-lists.ts'
import { ALLOWED_VARIANTS as VARIANT_LIST } from '../src/lib/variants.ts'
import type { DraftEntry, Resolved } from './build-types.ts'

// A Set here, an array in the app, which derives a suffix regex from the order.
const ALLOWED_VARIANTS: ReadonlySet<string> = new Set<string>(VARIANT_LIST)

/** Asks the API rather than pattern-matching the suffix, which regional forms break. */
async function resolveSpecies(slug: string): Promise<Resolved> {
  const mon = await fetch(`https://pokeapi.co/api/v2/pokemon/${slug}`)
  if (!mon.ok) throw new Error(`pokemon fetch failed for ${slug}: ${mon.status}`)
  const speciesUrl = ((await mon.json()) as { species: { url: string } }).species.url
  const species = await fetch(speciesUrl)
  if (!species.ok) throw new Error(`species fetch failed for ${slug}: ${species.status}`)
  const payload = (await species.json()) as {
    name: string
    id: number
    evolution_chain: { url: string }
  }
  return {
    name: payload.name,
    // Alolan Marowak is still #105, not #10115.
    nationalNo: payload.id,
    chain: payload.evolution_chain.url,
  }
}

async function pooled<T, R>(
  items: T[],
  worker: (item: T) => Promise<R>,
  limit = 12,
): Promise<Map<T, R>> {
  const out = new Map<T, R>()
  let cursor = 0
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const item = items[cursor++] as T
        out.set(item, await worker(item))
      }
    }),
  )
  return out
}

const here = dirname(fileURLToPath(import.meta.url))
const outFile = resolve(here, '..', 'src', 'data', 'regions.json')

const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=100000')
if (!res.ok) throw new Error(`PokeAPI list fetch failed: ${res.status}`)
const { results } = (await res.json()) as { results: { name: string; url: string }[] }

const entryIdBySlug = new Map(
  results.map((entry) => [entry.name, Number(entry.url.match(/\/(\d+)\/$/)?.[1])] as const),
)

const problems: string[] = []

const regions = REGIONS.map((region) => {
  const seen = new Set<string>()
  let regionalNo = 0

  const sections = region.sections.map((section) => ({
    label: section.label,
    note: section.note,
    entries: section.species.map((slug): DraftEntry => {
      const entryId = entryIdBySlug.get(slug)
      if (!entryId) {
        problems.push(`${region.id}: unknown species "${slug}"`)
      } else if (entryId >= 10000 && !ALLOWED_VARIANTS.has(slug)) {
        problems.push(
          `${region.id}: "${slug}" is an alternate form; add it to ALLOWED_VARIANTS to use it`,
        )
      }
      if (seen.has(slug)) problems.push(`${region.id}: duplicate species "${slug}"`)
      seen.add(slug)
      // nationalNo is filled in from the species record below.
      return { regionalNo: ++regionalNo, slug }
    }),
  }))

  const { sections: _dropped, ...meta } = region
  return { ...meta, sections, count: regionalNo }
})

const allSlugs = regions.flatMap((r) => r.sections.flatMap((s) => s.entries.map((e) => e.slug)))

if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}

const resolved = await pooled([...new Set(allSlugs)], resolveSpecies)

/** A miss here is a bug: every slug was resolved above. */
function speciesFor(slug: string) {
  const record = resolved.get(slug)
  if (!record) throw new Error(`no species record resolved for "${slug}"`)
  return record
}

for (const region of regions) {
  for (const section of region.sections) {
    for (const entry of section.entries) {
      entry.nationalNo = speciesFor(entry.slug).nationalNo
    }
  }
}

// A starter is handed to you by a professor, so it must not also be catchable.
const STARTER_LINES = await fetch('https://pokeapi.co/api/v2/pokemon-species?limit=100000')
  .then((r) => r.json())
  .then(({ results }: { results: { name: string }[] }) => {
    // PokeAPI exposes no "is a starter" flag, so the trios are hardcoded below
    // and the fetch only turns ids into slugs. Asserted in src/App.test.tsx.
    const ids: [from: number, to: number][] = [
      [1, 9], [152, 160], [252, 260], [387, 395], [495, 503],
      [650, 658], [722, 730], [810, 818], [906, 914],
    ]
    const slugs = new Set<string>()
    for (const [from, to] of ids) {
      for (const entry of results.slice(from - 1, to)) slugs.add(entry.name)
    }
    return slugs
  })

for (const region of regions) {
  region.sections.forEach((section, index) => {
    for (const entry of section.entries) {
      if (STARTER_LINES.has(speciesFor(entry.slug).name) && index !== 0) {
        problems.push(`${region.id}: starter "${entry.slug}" appears outside the starters section`)
      }
    }
  })
}

/**
 * Kanata is built on real cold-climate wildlife, so it excludes the kaiju
 * lineage. Explicit because nothing in the API records design ancestry.
 */
const KAIJU = new Set([
  'nidoran-f', 'nidorina', 'nidoqueen',
  'nidoran-m', 'nidorino', 'nidoking',
  'rhyhorn', 'rhydon', 'rhyperior',
  'aron', 'lairon', 'aggron',
  'larvitar', 'pupitar', 'tyranitar',
  'magikarp', 'gyarados',
  'groudon', 'kyogre', 'regigigas', 'guzzlord', 'eternatus',
])

/** No primates north of the treeline, and "is a monkey" is not in the API. */
const PRIMATES = new Set([
  'mankey', 'primeape', 'annihilape',
  'aipom', 'ambipom',
  'chimchar', 'monferno', 'infernape',
  'pansage', 'simisage', 'pansear', 'simisear', 'panpour', 'simipour',
  'darumaka', 'darmanitan',
  'slakoth', 'vigoroth', 'slaking',
  'oranguru', 'passimian',
  'grookey', 'thwackey', 'rillaboom',
])

for (const region of regions.filter((r) => r.id === 'kanata')) {
  for (const section of region.sections) {
    for (const entry of section.entries) {
      if (PRIMATES.has(entry.slug)) {
        problems.push(`${region.id}: "${entry.slug}" is a primate and cannot live here`)
      }
      if (KAIJU.has(entry.slug)) {
        problems.push(`${region.id}: "${entry.slug}" is a kaiju design and does not belong here`)
      }
    }
  }
}

// No species may appear in both regions.
const slugSets = regions.map(
  (r) => new Set(r.sections.flatMap((s) => s.entries.map((e) => e.slug))),
)
const first = slugSets[0] ?? new Set<string>()
const second = slugSets[1] ?? new Set<string>()
for (const slug of first) {
  if (second.has(slug)) problems.push(`"${slug}" appears in both regions`)
}

if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}

// The offline prefetch's work list.
const uniqueSlugs = [...new Set(allSlugs)].sort()

await mkdir(dirname(outFile), { recursive: true })
await writeFile(
  outFile,
  `${JSON.stringify({ regions, allSlugs: uniqueSlugs }, null, 2)}\n`,
  'utf8',
)

for (const region of regions) {
  console.log(`${region.name}: ${region.count} entries`)
}
console.log(`${uniqueSlugs.length} unique species total`)
console.log(`Wrote ${outFile}`)
