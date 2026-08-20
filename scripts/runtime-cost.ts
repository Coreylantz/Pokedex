/**
 * `budget.ts` weighs the deployed shell and says nothing about the species data
 * and sprites fetched from PokeAPI, which are an order of magnitude larger.
 *
 * Sampled and extrapolated rather than fetching all 330, which would be 990+
 * requests at somebody else's expense per run; spread across both dexes so it
 * is not all early-generation species with small sprites.
 *
 * Run with: npm run cost
 */
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import type { RegionData } from '../src/lib/types.ts'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const data = JSON.parse(
  await readFile(resolve(root, 'src', 'data', 'regions.json'), 'utf8'),
) as RegionData

const SAMPLE = 24
const API = 'https://pokeapi.co/api/v2'

/** Evenly spaced through the full list, so it is not just the first 24. */
const all = data.allSlugs
const step = Math.max(1, Math.floor(all.length / SAMPLE))
const sample = all.filter((_, i) => i % step === 0).slice(0, SAMPLE)

/**
 * `fetch` gunzips transparently, so measuring the body overstates PokeAPI's
 * JSON by roughly an order of magnitude. `content-length` is the compressed
 * length, which is what a metered connection is billed for.
 */
const wireBytes = async (url: string): Promise<{ wire: number; raw: number }> => {
  const res = await fetch(url, { headers: { 'accept-encoding': 'gzip, br' } })
  if (!res.ok) return { wire: 0, raw: 0 }
  const declared = Number(res.headers.get('content-length') ?? 0)
  const body = await res.arrayBuffer()
  // If the server did not declare a length, fall back to the decoded size.
  return { wire: declared || body.byteLength, raw: body.byteLength }
}

let pokemonBytes = 0
let pokemonRaw = 0
let speciesBytes = 0
let spriteBytes = 0
let shinyBytes = 0
let measured = 0

for (const slug of sample) {
  try {
    const mon = await wireBytes(`${API}/pokemon/${slug}`)
    if (!mon.wire) continue
    pokemonBytes += mon.wire
    pokemonRaw += mon.raw

    const detail = (await fetch(`${API}/pokemon/${slug}`).then((r) => r.json())) as {
      species: { name: string }
      sprites: { front_default: string | null; front_shiny: string | null }
    }

    speciesBytes += (await wireBytes(`${API}/pokemon-species/${detail.species.name}`)).wire
    if (detail.sprites.front_default) {
      spriteBytes += (await wireBytes(detail.sprites.front_default)).wire
    }
    if (detail.sprites.front_shiny) {
      shinyBytes += (await wireBytes(detail.sprites.front_shiny)).wire
    }
    measured++
  } catch {
    // A single miss does not invalidate an average.
  }
}

if (!measured) {
  console.error('Could not reach PokeAPI — no measurement taken.')
  process.exit(1)
}

const total = all.length
const mb = (n: number) => `${(n / 1024 / 1024).toFixed(1)} MB`.padStart(8)
const per = (n: number) => n / measured
const scale = (n: number) => per(n) * total

const full = scale(pokemonBytes) + scale(speciesBytes) + scale(spriteBytes) + scale(shinyBytes)
const saver = scale(pokemonBytes) + scale(speciesBytes) + scale(spriteBytes)

console.log(`\n  Runtime cost, extrapolated from ${measured} of ${total} species`)
console.log('  Transferred bytes (compressed), not decoded size.\n')
console.log(`  /pokemon JSON        ${mb(scale(pokemonBytes))}`)
console.log(`  /pokemon-species     ${mb(scale(speciesBytes))}`)
console.log(`  sprites, default     ${mb(scale(spriteBytes))}`)
console.log(`  sprites, shiny       ${mb(scale(shinyBytes))}`)
console.log(`  ${'-'.repeat(32)}`)
console.log(`  full offline prime   ${mb(full)}   ${total * 4} requests`)
console.log(`  with data saver      ${mb(saver)}   ${total * 3} requests`)
console.log(`  deployed app shell   ${mb(131.8 * 1024)}   (for comparison)\n`)
console.log(
  `  /pokemon decodes to ${mb(per(pokemonRaw) * total).trim()} in memory but transfers as\n` +
    `  ${mb(scale(pokemonBytes)).trim()} — a ${(pokemonRaw / pokemonBytes).toFixed(0)}x gzip ratio. It is the whole story:\n` +
    `  sprites are ${((scale(spriteBytes) + scale(shinyBytes)) / full * 100).toFixed(0)}% of the download, and the app shell is ` +
    `${((131.8 * 1024) / full * 100).toFixed(1)}%.\n`,
)
