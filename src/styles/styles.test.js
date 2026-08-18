import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * The stylesheet is split across ~25 files whose cascade behaviour depends on
 * the import order in index.css, not on specificity alone. Nothing in the build
 * complains if a file is added and never imported, or imported twice, or if the
 * layer statement drifts out of sync with the layers the files actually open —
 * so these check it.
 */
const here = dirname(fileURLToPath(import.meta.url))
const barrel = readFileSync(resolve(here, 'index.css'), 'utf8')
const imported = [...barrel.matchAll(/@import '\.\/(.+?\.css)'/g)].map((m) => m[1])
const files = readdirSync(here).filter((f) => f.endsWith('.css') && f !== 'index.css')

describe('stylesheet barrel', () => {
  it('imports every file in the directory', () => {
    expect([...imported].sort()).toEqual([...files].sort())
  })

  it('imports each file exactly once', () => {
    expect(imported).toHaveLength(new Set(imported).size)
  })

  it('declares the layer order before the first import', () => {
    const declaration = barrel.indexOf('@layer ')
    expect(declaration).toBeGreaterThan(-1)
    expect(declaration).toBeLessThan(barrel.indexOf('@import'))
  })

  it('only opens layers named in the declaration', () => {
    const statement = /@layer ([^;]+);/.exec(barrel)
    expect(statement).not.toBeNull()
    const declared = new Set(statement?.[1].split(',').map((name) => name.trim()))
    for (const file of files) {
      const css = readFileSync(resolve(here, file), 'utf8')
      const opened = [...css.matchAll(/@layer ([a-z]+) \{/g)].map((m) => m[1])
      expect(opened.length, `${file} opens no layer`).toBeGreaterThan(0)
      for (const layer of opened) {
        expect(declared, `${file} opens undeclared layer "${layer}"`).toContain(layer)
      }
    }
  })

  it('keeps every file small enough to read in one sitting', () => {
    for (const file of files) {
      const lines = readFileSync(resolve(here, file), 'utf8').split('\n').length
      expect(lines, `${file} is ${lines} lines`).toBeLessThan(260)
    }
  })
})
