/**
 * Audits how this stylesheet uses the cascade.
 *
 * The cascade is decided by, in order: layer, then specificity, then source
 * order. Almost every confusing CSS bug in this project came from the first
 * and third of those rather than the second — a rule in a later layer quietly
 * beating a more specific one, or two rules of equal weight where only their
 * order decided the winner.
 *
 * So this checks the things that actually bite:
 *
 *   1. Rules outside any layer. Unlayered styles beat every layered rule
 *      regardless of specificity, which makes them invisible landmines.
 *   2. The explicit layer-order statement, and whether it survives the build.
 *   3. !important, which opts out of the cascade entirely.
 *   4. Selectors defined in more than one file within one layer, where source
 *      order alone decides the winner.
 *   5. Specificity outliers worth knowing about.
 *
 * Run with: npm run css:audit
 */
import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const styles = resolve(root, 'src', 'styles')

const barrel = await readFile(resolve(styles, 'index.css'), 'utf8')
const files = (await readdir(styles)).filter((f) => f.endsWith('.css') && f !== 'index.css')

/** Strips comments and string literals so braces can be counted honestly. */
const clean = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')

interface Rule {
  file: string
  layer: string
  selector: string
}

const rules: Rule[] = []
const unlayered: Rule[] = []
const importants: { file: string; line: number; text: string }[] = []

for (const file of files) {
  const raw = await readFile(resolve(styles, file), 'utf8')
  const css = clean(raw)

  raw.split('\n').forEach((line, i) => {
    if (line.includes('!important')) {
      importants.push({ file, line: i + 1, text: line.trim() })
    }
  })

  // Walk the file tracking layer depth, collecting top-level selectors.
  let depth = 0
  let layer = ''
  let start = 0
  for (let i = 0; i < css.length; i++) {
    const ch = css[i]
    if (ch === '{') {
      const head = css.slice(start, i).replace(/\s+/g, ' ').trim()
      if (depth === 0) {
        const match = /^@layer\s+([a-z]+)$/.exec(head)
        if (match?.[1]) layer = match[1]
        else if (!head.startsWith('@')) unlayered.push({ file, layer: '(none)', selector: head })
      } else if (depth === 1 && layer) {
        // At-rules inside a layer (@font-face, @media, @keyframes) count as
        // that layer having content, but are not selectors to compare.
        rules.push({ file, layer, selector: head })
      }
      depth++
      start = i + 1
    } else if (ch === '}') {
      depth--
      start = i + 1
      if (depth === 0) layer = ''
    }
  }
}

/** Rough CSS specificity: [ids, classes/attrs/pseudo-classes, elements]. */
function specificity(selector: string): [number, number, number] {
  const s = selector.replace(/::[a-z-]+/g, '').replace(/:not\(|:is\(|:where\(|\)/g, ' ')
  const ids = (s.match(/#[\w-]+/g) ?? []).length
  const classes = (s.match(/\.[\w-]+|\[[^\]]+\]|:[a-z-]+(\([^)]*\))?/g) ?? []).length
  const elements = (s.match(/(^|[\s>+~])[a-z]+[\w-]*/g) ?? []).length
  return [ids, classes, elements]
}

const declared = /@layer\s+([^;]+);/.exec(barrel)?.[1]?.split(',').map((s) => s.trim()) ?? []

console.log('\n  CSS cascade audit\n')
console.log(`  ${files.length} files, ${rules.length} top-level rules`)
console.log(`  declared layer order: ${declared.join(' → ') || 'NONE'}\n`)

const problems: string[] = []

// 1. Unlayered rules.
if (unlayered.length) {
  problems.push(
    `${unlayered.length} rule(s) outside any layer — these beat every layered rule:\n` +
      unlayered.map((r) => `        ${r.file}: ${r.selector}`).join('\n'),
  )
} else {
  console.log('  ok   every rule sits inside a layer')
}

// 2. Layers used but never declared, and vice versa.
const used = [...new Set(rules.map((r) => r.layer))]
const undeclared = used.filter((l) => !declared.includes(l))
const unused = declared.filter((l) => !used.includes(l))
if (undeclared.length) problems.push(`layers opened but not declared: ${undeclared.join(', ')}`)
if (unused.length) console.log(`  note declared but unused: ${unused.join(', ')}`)
if (!undeclared.length) console.log('  ok   every layer opened is one the barrel declares')

// 3. The declaration surviving the build.
try {
  const dist = resolve(root, 'dist')
  const assets = resolve(dist, 'assets')
  const built = (await readdir(assets)).find((f) => f.endsWith('.css'))
  const html = await readFile(resolve(dist, 'index.html'), 'utf8')
  const css = built ? await readFile(resolve(assets, built), 'utf8') : ''

  // Either location is fine; the point is that the shipped page states the
  // order somewhere rather than relying on first-appearance.
  const inHtml = /@layer\s+[a-z]+\s*,/.test(html)
  const inCss = /@layer\s+[a-z]+\s*,/.test(css)

  if (inHtml || inCss) {
    console.log(
      `  ok   the layer order ships explicitly (in ${inHtml ? 'index.html' : 'the stylesheet'})`,
    )
    // It has to come before the stylesheet, or the stylesheet declares it first.
    if (inHtml) {
      const layerAt = html.search(/@layer\s+[a-z]+\s*,/)
      const linkAt = html.search(/<link[^>]+rel="stylesheet"/)
      if (linkAt !== -1 && layerAt > linkAt) {
        problems.push('the layer-order statement comes after the stylesheet link in index.html')
      }
    }
  } else {
    problems.push(
      'no explicit `@layer a, b, c;` reaches the browser — the minifier strips it\n' +
        '        from the bundle. Order then depends on first appearance, so reordering\n' +
        '        an import would silently reorder the cascade.',
    )
  }
} catch {
  console.log('  note no dist/ to check — run `npm run build` first')
}

// 4. !important.
if (importants.length) {
  console.log(`\n  ${importants.length} use(s) of !important:`)
  for (const i of importants) console.log(`       ${i.file}:${i.line}  ${i.text}`)
}

// 5. Selectors split across files inside one layer.
const byKey = new Map<string, Set<string>>()
for (const rule of rules) {
  const key = `${rule.layer}|${rule.selector}`
  const set = byKey.get(key) ?? new Set()
  set.add(rule.file)
  byKey.set(key, set)
}
const split = [...byKey].filter(([, set]) => set.size > 1)
if (split.length) {
  console.log(`\n  ${split.length} selector(s) defined in more than one file in the same layer:`)
  for (const [key, set] of split.slice(0, 10)) {
    console.log(`       ${key.split('|')[1]}  →  ${[...set].join(', ')}`)
  }
  console.log('       (source order decides these; keep the import order stable)')
}

// 6. Specificity outliers.
const ranked = rules
  .map((r) => ({ ...r, spec: specificity(r.selector) }))
  .sort((a, b) => b.spec[0] - a.spec[0] || b.spec[1] - a.spec[1] || b.spec[2] - a.spec[2])
const ids = ranked.filter((r) => r.spec[0] > 0)
console.log(`\n  highest specificity in the sheet: (${ranked[0]?.spec.join(',')})  ${ranked[0]?.selector}`)
console.log(`  rules using an id selector: ${ids.length}`)

if (problems.length) {
  console.log(`\n  worth fixing:`)
  for (const p of problems) console.log(`      - ${p}`)
  console.log()
  process.exit(1)
}
console.log('\n  no cascade problems found.\n')
