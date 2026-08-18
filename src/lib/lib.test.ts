import { describe, expect, it, beforeEach } from 'vitest'
import { isTextEntry, moveFocus } from './focusNav'
import { dexNumber, idSafe, pad2, speciesName, titleCase } from './format'
import { ALLOWED_VARIANTS, SUFFIX_PATTERN } from './variants'
import { pooled } from './pool'

/**
 * The pure helpers, at their edges.
 *
 * The app-level tests cover these through the UI, which proves they work for
 * the inputs the UI happens to produce. What they cannot show is what happens
 * at a boundary — focus at the end of a list, a slug that looks like a form
 * but is not — and those are where the bugs have actually been.
 */

describe('speciesName', () => {
  it('strips the suffix of every allowed form', () => {
    for (const slug of ALLOWED_VARIANTS) {
      const base = speciesName(slug)
      expect(base).not.toContain('-')
      expect(slug.startsWith(base)).toBe(true)
    }
  })

  it('leaves a hyphenated species that is not a form alone', () => {
    // These are whole species names, not `species-form`, and stripping them
    // would send the client looking up a species that does not exist.
    for (const slug of ['nidoran-f', 'nidoran-m', 'ho-oh', 'porygon-z', 'mr-mime']) {
      expect(speciesName(slug)).toBe(slug)
    }
  })

  it('only matches a suffix at the end', () => {
    expect(SUFFIX_PATTERN.test('alola-something')).toBe(false)
    expect(SUFFIX_PATTERN.test('marowak-alola')).toBe(true)
  })
})

describe('formatters', () => {
  it('pads dex numbers the way the games print them', () => {
    expect(dexNumber(1)).toBe('001')
    expect(dexNumber(25)).toBe('025')
    expect(dexNumber(1025)).toBe('1025')
    expect(pad2(3)).toBe('03')
  })

  it('title-cases each hyphenated part', () => {
    expect(titleCase('bidoof')).toBe('Bidoof')
    expect(titleCase('mr-mime')).toBe('Mr Mime')
  })

  it('reduces a stat name to something usable as an id', () => {
    expect(idSafe('Sp. Attack')).toBe('SpAttack')
    expect(idSafe('HP')).toBe('HP')
  })
})

describe('moveFocus', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="root">
        <button id="a"></button>
        <button id="b"></button>
        <button id="c" disabled></button>
        <span hidden><button id="hidden"></button></span>
      </div>`
  })

  const root = () => document.getElementById('root')

  it('focuses the first item when nothing inside is focused', () => {
    expect(moveFocus(root(), 'right')).toBe(true)
    expect(document.activeElement?.id).toBe('a')
  })

  it('stops at the ends rather than wrapping', () => {
    document.getElementById('a')?.focus()
    // Already at the start: there is nowhere left to go.
    expect(moveFocus(root(), 'left')).toBe(false)
    expect(document.activeElement?.id).toBe('a')

    expect(moveFocus(root(), 'right')).toBe(true)
    expect(document.activeElement?.id).toBe('b')
    // `c` is disabled and the hidden button is inside [hidden], so `b` is last.
    expect(moveFocus(root(), 'right')).toBe(false)
    expect(document.activeElement?.id).toBe('b')
  })

  it('does nothing without a root', () => {
    expect(moveFocus(null, 'down')).toBe(false)
  })

  it('does nothing when there is nothing focusable', () => {
    document.body.innerHTML = '<div id="empty"><p>text</p></div>'
    expect(moveFocus(document.getElementById('empty'), 'down')).toBe(false)
  })
})

describe('isTextEntry', () => {
  it('recognises fields that need the arrow keys themselves', () => {
    document.body.innerHTML = '<input id="i"><button id="b"></button>'
    expect(isTextEntry(document.getElementById('i'))).toBe(true)
    expect(isTextEntry(document.getElementById('b'))).toBe(false)
    expect(isTextEntry(null)).toBe(false)
  })
})

describe('pooled', () => {
  it('runs every item and reports no failures on a clean pass', async () => {
    const seen: number[] = []
    const failures = await pooled([1, 2, 3, 4, 5], async (n) => {
      seen.push(n)
    })
    expect(failures).toBe(0)
    expect(seen.sort()).toEqual([1, 2, 3, 4, 5])
  })

  it('counts failures without abandoning the rest', async () => {
    const done: number[] = []
    const failures = await pooled(
      [1, 2, 3, 4],
      async (n) => {
        if (n % 2 === 0) throw new Error('nope')
      },
      { onSettled: (n) => done.push(n) },
    )
    expect(failures).toBe(2)
    // Everything still settled, including the ones that threw.
    expect(done.sort()).toEqual([1, 2, 3, 4])
  })

  it('stops early when cancelled', async () => {
    let started = 0
    await pooled(
      Array.from({ length: 50 }, (_, i) => i),
      async () => {
        started++
      },
      { limit: 1, cancelled: () => started >= 3 },
    )
    expect(started).toBeLessThan(10)
  })

  it('handles an empty list', async () => {
    const never = async () => {
      throw new Error('worker must not run for an empty list')
    }
    expect(await pooled([], never)).toBe(0)
  })
})
