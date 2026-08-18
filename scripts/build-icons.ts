/**
 * Generates the PWA icon set as real PNGs, with no image-library dependency.
 *
 * The mark is a dex-ball split between the two regions: aurora teal on top for
 * Kanata, sun amber below for Anahua. Rasterised by hand into an RGBA buffer,
 * then encoded with node's built-in zlib.
 *
 * Run with: npm run build:icons
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { deflateSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const outDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')

/** RGB triples. Alpha is added at sample time. */
type Rgb = [number, number, number]
interface Box { x0: number; y0: number; x1: number; y1: number; r: number }

const SHELL: Rgb = [198, 40, 40]
const BEZEL: Rgb = [55, 55, 63]
const GLASS: Rgb = [216, 220, 200]
const LENS: Rgb = [47, 127, 212]
const LAMP_RED: Rgb = [240, 82, 74]
const LAMP_YELLOW: Rgb = [242, 208, 69]
const LAMP_GREEN: Rgb = [79, 208, 127]
const INK: Rgb = [16, 22, 38]
const BONE: Rgb = [247, 239, 233]

const crcTable = Int32Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c
})

function crc32(buf: Buffer): number {
  let c = -1
  for (const byte of buf) c = (crcTable[(c ^ byte) & 0xff] ?? 0) ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function encodePng(width: number, height: number, rgba: Buffer): Buffer {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // truecolour with alpha
  // Prefix each scanline with filter type 0.
  const raw = Buffer.alloc(height * (width * 4 + 1))
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/**
 * Renders the device at `size`, supersampled 3x for clean edges.
 *
 * It is the Pokedex itself rather than an abstract mark: red shell, blue lens,
 * three lamps, dark screen. Everything is proportional to the canvas so the
 * same routine produces a legible 180px touch icon and a legible 512px tile,
 * and `inset` reserves the maskable safe zone.
 */
function drawIcon(
  size: number,
  { inset = 0, background = null }: { inset?: number; background?: Rgb | null } = {},
): Buffer {
  const SS = 3
  const px = Buffer.alloc(size * size * 4)
  const pad = size * (inset || 0.04)
  const w = size - pad * 2

  // Everything below is in fractions of the shell, resolved to pixels once.
  const shell = { x0: pad, y0: pad, x1: size - pad, y1: size - pad, r: w * 0.12 }
  const lens = { cx: pad + w * 0.24, cy: pad + w * 0.24, r: w * 0.13 }
  const lamps = [0.5, 0.64, 0.78].map((fx, i) => ({
    cx: pad + w * fx,
    cy: pad + w * 0.19,
    r: w * 0.047,
    col: ([LAMP_RED, LAMP_YELLOW, LAMP_GREEN][i] ?? LAMP_RED) as Rgb,
  }))
  const bezel = { x0: pad + w * 0.1, y0: pad + w * 0.44, x1: pad + w * 0.9, y1: pad + w * 0.82, r: 0 }
  const glass = { x0: pad + w * 0.16, y0: pad + w * 0.5, x1: pad + w * 0.84, y1: pad + w * 0.76, r: 0 }

  const inRounded = (x: number, y: number, b: Box) =>
    x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1 &&
    // Knock the corners off with a radius check.
    !(
      (x < b.x0 + b.r && y < b.y0 + b.r && Math.hypot(x - (b.x0 + b.r), y - (b.y0 + b.r)) > b.r) ||
      (x > b.x1 - b.r && y < b.y0 + b.r && Math.hypot(x - (b.x1 - b.r), y - (b.y0 + b.r)) > b.r) ||
      (x < b.x0 + b.r && y > b.y1 - b.r && Math.hypot(x - (b.x0 + b.r), y - (b.y1 - b.r)) > b.r) ||
      (x > b.x1 - b.r && y > b.y1 - b.r && Math.hypot(x - (b.x1 - b.r), y - (b.y1 - b.r)) > b.r)
    )

  const within = (box: Box, x: number, y: number) =>
    x >= box.x0 && x <= box.x1 && y >= box.y0 && y <= box.y1

  /**
   * The colour of the device at one point, front to back: screen glass, then
   * the bezel around it, then the lens and its rim, then a lamp, then bare
   * shell. Returns null outside the shell entirely.
   *
   * Lifted out of the sampling loops rather than left inline. Nested four
   * loops deep it scored 60 on cognitive complexity against a limit of 15 —
   * not because the decision is hard, but because every branch was charged for
   * the loops enclosing it. On its own it is a flat list of cases.
   */
  const colourAt = (x: number, y: number): Rgb | null => {
    if (!inRounded(x, y, shell)) return null
    if (within(glass, x, y)) return GLASS
    if (within(bezel, x, y)) return BEZEL

    const toLens = Math.hypot(x - lens.cx, y - lens.cy)
    if (toLens <= lens.r) return LENS
    if (toLens <= lens.r * 1.28) return BONE

    return lamps.find((lamp) => Math.hypot(x - lamp.cx, y - lamp.cy) <= lamp.r)?.col ?? SHELL
  }

  const empty: number[] = background ? [...background, 255] : [0, 0, 0, 0]

  /**
   * Sums the SS x SS samples taken inside one output pixel.
   *
   * Split from the pixel loop so the nesting stops at two levels. Four levels
   * of loop with a colour decision at the bottom is not conceptually hard, but
   * cognitive complexity charges the decision once for every loop above it,
   * which is a fair description of how it reads.
   */
  const supersample = (x: number, y: number): number[] => {
    let acc = [0, 0, 0, 0]
    for (let sy = 0; sy < SS; sy++) {
      for (let sx = 0; sx < SS; sx++) {
        const col = colourAt(x + (sx + 0.5) / SS, y + (sy + 0.5) / SS)
        const sample = col ? [...col, 255] : empty
        acc = acc.map((v, i) => v + (sample[i] ?? 0))
      }
    }
    return acc
  }

  const n = SS * SS

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const acc = supersample(x, y)
      const o = (y * size + x) * 4
      // Un-premultiply so partially covered edge pixels keep their colour:
      // acc[i] is a sum of channel values weighted by coverage, and acc[3] is
      // that same coverage expressed in 0-255 units.
      const [r = 0, g = 0, b = 0, a = 0] = acc
      const alpha = a / n
      const scale = a > 0 ? 255 / a : 0
      px[o] = Math.round(r * scale)
      px[o + 1] = Math.round(g * scale)
      px[o + 2] = Math.round(b * scale)
      px[o + 3] = Math.round(alpha)
    }
  }
  return encodePng(size, size, px)
}

await mkdir(outDir, { recursive: true })

const files: [name: string, png: Buffer][] = [
  ['icon-192.png', drawIcon(192)],
  ['icon-512.png', drawIcon(512)],
  // Maskable icons are cropped to a circle by some launchers, so the mark is
  // shrunk into the 80% safe zone and sat on an opaque plate.
  ['maskable-192.png', drawIcon(192, { inset: 0.22, background: INK })],
  ['maskable-512.png', drawIcon(512, { inset: 0.22, background: INK })],
  ['apple-touch-icon.png', drawIcon(180, { inset: 0.1, background: INK })],
]

for (const [name, buf] of files) {
  await writeFile(resolve(outDir, name), buf)
  console.log(`${name} — ${(buf.length / 1024).toFixed(1)} kB`)
}
