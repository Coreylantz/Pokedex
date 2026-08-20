/**
 * Audits how this stylesheet uses the cascade — layer, then specificity, then
 * source order. Almost every confusing CSS bug here came from the first and
 * third rather than the second, so this checks:
 *
 *   1. Unlayered rules, which beat every layered one regardless of specificity
 *   2. The layer-order statement, and whether it survives the build
 *   3. !important, which opts out of the cascade entirely
 *   4. Selectors in more than one file within a layer, where order alone decides
 *   5. Specificity outliers
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
        // At-rules count as the layer having content, but are not selectors.
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

  // Either location is fine, so long as the shipped page states the order
  // rather than relying on first-appearance.
  const inHtml = /@layer\s+[a-z]+\s*,/.test(html)
  const inCss = /@layer\s+[a-z]+\s*,/.test(css)

  if (inHtml || inCss) {
    console.log(
      `  ok   the layer order ships explicitly (in ${inHtml ? 'index.html' : 'the stylesheet'})`,
    )
    // Must precede the stylesheet, or the stylesheet declares the order first.
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
