/**
 * Persistence and offline behaviour live in the service worker's cache-first
 * routes, so this layer only needs an in-memory map to stop React re-rendering
 * from re-issuing work within a session.
 */
import { titleCase } from './format'
import type { Pokemon } from './types'

const API = 'https://pokeapi.co/api/v2'

/**
 * Only the fields this app reads: narrowing to what is consumed means an
 * upstream change surfaces as a type error rather than `undefined` in the UI.
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

export function loadPokemon(slug: string): Promise<Pokemon> {
  return once(slug, async () => {
    const mon = await getJson<ApiPokemon>(`/pokemon/${slug}`)
    // Default forms like `lycanroc-midday` 404 on /pokemon-species, but the
    // Pokemon record always carries the real species name.
    const species = await getJson<ApiSpecies>(`/pokemon-species/${mon.species.name}`)

    const flavour = english(species.flavor_text_entries)

    return {
      displayName: english(species.names)?.name ?? titleCase(slug),
      genus: english(species.genera)?.genus ?? '',
      // The API stores the cartridge text's newlines and soft hyphens.
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
      // `latest` is the remaster; some species only have the cartridge
      // recording, and some carry an empty string rather than null.
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

/** 2'04", as the games print it. */
function toFeetInches(metres: number): string {
  const totalInches = Math.round(metres * 39.3701)
  return `${Math.floor(totalInches / 12)}'${String(totalInches % 12).padStart(2, '0')}"`
}

const nonEmpty = (value: string | null | undefined): string | null =>
  typeof value === 'string' && value.trim() ? value : null
