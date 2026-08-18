# Twin Dex

A personal project for experimenting with [PokéAPI](https://pokeapi.co).

## Setup

Requires Node 24+ and pnpm (`corepack enable pnpm`).

```bash
pnpm install
pnpm dev
```

## Scripts

| Command | Does |
| --- | --- |
| `pnpm dev` | Dev server |
| `pnpm build` | Production build |
| `pnpm verify` | Everything CI runs |
| `pnpm storybook` | Component workbench |
| `pnpm test` · `test:stories` · `test:e2e` | Unit · Storybook · end-to-end |
| `pnpm lint` · `typecheck` · `size` · `knip` | Linters, types, bundle budgets, dead code |
| `pnpm build:dex` · `build:icons` · `build:fonts` | Regenerate data, icons, subsetted fonts |
| `pnpm audit` · `vitals` · `coverage` · `jank` · `css:audit` | Lighthouse, Core Web Vitals, code coverage, scroll jank, CSS cascade |

## Features

- Two invented regions, each on a different generation of Pokédex hardware
- Installable PWA, works offline
- Search, type filters, shiny toggle, working D-pad and keyboard navigation
- Chiptune sound effects and haptics, both off by default
- Settings for typeface, text size, contrast, motion, device frame and data saver
- An unlinked `/explained` route giving the reasoning behind each entry

## Notes

- Dex data is generated: `pnpm build:dex` resolves every slug against PokéAPI,
  so dex numbers are never typed by hand, and validates the placement rules.
- Offline: entries are cached as you open them; Settings can download the full
  dex (~4 MB) or hold back on a metered connection.
- Accessibility: axe runs at WCAG 2.2 AA + AAA plus best-practice across every
  screen and three viewports, with nothing disabled.
