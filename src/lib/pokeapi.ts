/**
 * Thin PokeAPI client.
 *
 * Every request goes through the service worker's cache-first routes, so this
 * layer only needs an in-memory map to stop React re-rendering from re-issuing
 * work within a session. Persistence and offline behaviour live in the SW.
 */
import { titleCase } from './format'
import type { Pokemon } from './types'

const API = 'https://pokeapi.co/api/v2'

/**
 * Only the fields this app reads. Typing PokeAPI's full response would be
 * thousands of lines of someone else's schema, and would go stale silently;
 * narrowing to what is actually consumed means a change upstream shows up
 * here as a type error rather than as `undefined` in the UI.
 */
interface ApiPokemon {
  species: { name: string }
  types: { slot: number; type: { name: string } }[]
  height: number
  weight: number
  stats: { stat: { name: string }; base_stat: number }[]
  sprites: { front_default: string | null; front_shiny: string | null }
  cries?: { latest?: string | null; legacy?: string | null }
}

interface LocalisedName {
  language: { name: string }
}

interface ApiSpecies {
  names: (LocalisedName & { name: string })[]
  genera: (LocalisedName & { genus: string })[]
  flavor_text_entries: (LocalisedName & { flavor_text: string })[]
}

const inflight = new Map<string, Promise<Pokemon>>()
const memo = new Map<string, Pokemon>()

function once(key: string, load: () => Promise<Pokemon>): Promise<Pokemon> {
  const cached = memo.get(key)
  if (cached) return Promise.resolve(cached)

  const pending = inflight.get(key)
  if (pending) return pending

  const promise = load()
    .then((value) => {
      memo.set(key, value)
      return value
    })
    .finally(() => inflight.delete(key))

  inflight.set(key, promise)
  return promise
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`)
  if (!res.ok) throw new Error(`PokeAPI ${path} responded ${res.status}`)
  return res.json() as Promise<T>
}

const english = <T extends LocalisedName>(entries: T[]): T | undefined =>
  entries.find((entry) => entry.language.name === 'en')

/** Everything the UI needs about one species, flattened out of two endpoints. */
export function loadPokemon(slug: string): Promise<Pokemon> {
  return once(slug, async () => {
    const mon = await getJson<ApiPokemon>(`/pokemon/${slug}`)
    // Some default forms are named `lycanroc-midday`, `mimikyu-disguised` and
    // so on, which 404 on /pokemon-species. The Pokemon record always carries
    // the real species name, so resolve through that rather than the slug.
    const species = await getJson<ApiSpecies>(`/pokemon-species/${mon.species.name}`)

    const flavour = english(species.flavor_text_entries)

    return {
      displayName: english(species.names)?.name ?? titleCase(slug),
      genus: english(species.genera)?.genus ?? '',
      // The API stores newlines and soft hyphens from the original cartridge text.
      flavourText: flavour
        ? flavour.flavor_text.replace(/­\n/g, '').replace(/[\n\f\r]/g, ' ').trim()
        : '',
      types: [...mon.types].sort((a, b) => a.slot - b.slot).map((t) => t.type.name),
      // API units are decimetres and hectograms.
      heightM: mon.height / 10,
      weightKg: mon.weight / 10,
      // The games' English Pokedex prints imperial, so the screen does too.
      heightImperial: toFeetInches(mon.height / 10),
      weightImperial: `${((mon.weight / 10) * 2.20462).toFixed(1)} lb`,
      stats: mon.stats.map((s) => ({
        name: STAT_LABELS[s.stat.name] ?? s.stat.name,
        value: s.base_stat,
      })),
      sprite: mon.sprites.front_default,
      spriteShiny: mon.sprites.front_shiny,
      // The games' own cry. `latest` is the remastered one; fall back to the
      // cartridge recording for the species that have no remaster. Some
      // entries carry an empty string rather than null, which is not a cry.
      cry: nonEmpty(mon.cries?.latest) ?? nonEmpty(mon.cries?.legacy) ?? null,
    }
  })
}

const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Attack',
  'special-defense': 'Sp. Defense',
  speed: 'Speed',
}

/** Formats metres the way the games print them: 2'04". */
function toFeetInches(metres: number): string {
  const totalInches = Math.round(metres * 39.3701)
  return `${Math.floor(totalInches / 12)}'${String(totalInches % 12).padStart(2, '0')}"`
}

const nonEmpty = (value: string | null | undefined): string | null =>
  typeof value === 'string' && value.trim() ? value : null
