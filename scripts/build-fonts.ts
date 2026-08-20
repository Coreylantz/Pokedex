/**
 * Subsets the Silkscreen webfonts into `public/fonts/`; the originals live in
 * `fonts-src/` and are never shipped. Run with: npm run build:fonts
 *
 * The character set is deliberately a superset. Most text on screen arrives
 * from PokeAPI at runtime, so scraping the source would look complete and then
 * silently swap a glyph to the fallback face mid-word on Flabébé.
 */
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import subsetFont from 'subset-font'
// Leaf modules, so Node's type stripping loads them directly. `format.ts`
// cannot: it imports `./variants` without an extension, which the bundler
// resolves and Node does not.
import { pooled } from '../src/lib/pool.ts'
import { SUFFIX_PATTERN } from '../src/lib/variants.ts'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const src = resolve(root, 'fonts-src')
const out = resolve(root, 'public', 'fonts')

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => String.fromCodePoint(from + i)).join('')

/** Every character the checked-in source can render. */
async function charsInSource(): Promise<string> {
  const files: string[] = []
  const walk = async (dir: string) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) await walk(path)
      else if (/\.(tsx?|css|html|json)$/.test(entry.name)) files.push(path)
    }
  }
  await walk(resolve(root, 'src'))
  files.push(resolve(root, 'index.html'))

  const chars = new Set<string>()
  for (const file of files) {
    for (const ch of await readFile(file, 'utf8')) chars.add(ch)
  }
  return [...chars].join('')
}

/**
 * Enumerated rather than guessed: "ASCII plus Latin-1" costs 2 kB per weight
 * for letters that may never appear, while "ASCII only" saves 36% and breaks
 * the first name carrying an é. Cached in `fonts-src/charset.txt`.
 *
 * Pass --refresh to re-fetch after changing the region lists.
 */
async function charsInDexData(slugs: string[]): Promise<string> {
  const cache = resolve(src, 'charset.txt')
  if (!process.argv.includes('--refresh')) {
    try {
      return await readFile(cache, 'utf8')
    } catch {
      // Not cached yet; fall through and build it.
    }
  }

  console.log(`  fetching species text for ${slugs.length} species...`)
  const chars = new Set<string>()
  await pooled(slugs, async (slug) => {
    const species = slug.replace(SUFFIX_PATTERN, '')
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${species}`)
    if (!res.ok) return
    const record = (await res.json()) as {
      names: { language: { name: string }; name: string }[]
      genera: { language: { name: string }; genus: string }[]
      flavor_text_entries: { language: { name: string }; flavor_text: string }[]
    }
    const english = [
      ...record.names.filter((n) => n.language.name === 'en').map((n) => n.name),
      ...record.genera.filter((g) => g.language.name === 'en').map((g) => g.genus),
      ...record.flavor_text_entries
        .filter((f) => f.language.name === 'en')
        .map((f) => f.flavor_text),
    ].join('')
    for (const ch of english) chars.add(ch)
  })

  const text = [...chars].sort().join('')
  await writeFile(cache, text, 'utf8')
  return text
}

const data = JSON.parse(
  await readFile(resolve(root, 'src', 'data', 'regions.json'), 'utf8'),
) as { allSlugs: string[] }

const CHARSET = [
  // Printable ASCII — the overwhelming majority of everything on screen.
  range(0x20, 0x7e),
  // Everything the source itself can render, including the °/º and the ●/○ the
  // criteria list draws.
  await charsInSource(),
  // Everything the API will hand us for these 330 species.
  await charsInDexData(data.allSlugs),
  // PokeAPI's cartridge text is inconsistent about these, so keep them whether
  // or not this sample used them.
  '‐‑–—‘’“”…',
].join('')

await mkdir(out, { recursive: true })

const kb = (n: number) => `${(n / 1024).toFixed(1)} kB`.padStart(8)
let before = 0
let after = 0

for (const weight of ['400', '700']) {
  const name = `silkscreen-${weight}.woff2`
  const original = await readFile(resolve(src, name))
  const subset = await subsetFont(original, CHARSET, { targetFormat: 'woff2' })

  await writeFile(resolve(out, name), subset)
  before += original.length
  after += subset.length

  const saved = ((1 - subset.length / original.length) * 100).toFixed(1)
  console.log(`  ${name.padEnd(24)} ${kb(original.length)} -> ${kb(subset.length)}  (-${saved}%)`)
}

// The licence has to travel with the font, subset or not.
await writeFile(
  resolve(out, 'Silkscreen-OFL.txt'),
  await readFile(resolve(src, 'Silkscreen-OFL.txt'), 'utf8'),
  'utf8',
)

console.log(`  ${'total'.padEnd(24)} ${kb(before)} -> ${kb(after)}`)
console.log(`\n  ${[...new Set(CHARSET)].length} distinct characters requested.\n`)
