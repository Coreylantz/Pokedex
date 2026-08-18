# Twin Dex

A personal project for experimenting with [PokéAPI](https://pokeapi.co) — an
offline-capable Pokédex for two invented regions, each rendered on a different
generation of handheld hardware.

Not affiliated with or endorsed by Nintendo, Game Freak or The Pokémon Company.
Pokémon names and sprites belong to their owners; this is a fan project built to
try things out.

## Running it

```bash
pnpm install
pnpm dev
```

Requires Node 24+ and pnpm (`corepack enable pnpm`).

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server |
| `pnpm verify` | Everything CI runs: lint, types, tests, build, budgets, e2e, vitals |
| `pnpm storybook` | Component workbench with a11y and interaction tests |
| `pnpm build:dex` | Regenerates the dex data from PokéAPI |

## What it is

Two regions, each with its own hardware skin: **Kanata** on a first-generation
Pokédex (red shell, four-shade monochrome screen), **Anahua** on a
second-generation one (gold shell, colour screen). Sprites stay in full colour
on both.

Species lists are hand-authored but the data is generated: `pnpm build:dex`
resolves every slug against PokéAPI so national dex numbers are never typed by
hand, then validates the placement rules — no species in both regions, starters
only in starters sections, and every evolution line carrying a reason that meets
at least one of four criteria.

There is an unlinked `/explained` route that shows that reasoning per entry.

## Notes

- **Offline** — a service worker caches entries as you open them; Settings has a
  button to download the full dex (~4 MB) and a data-saver toggle.
- **Accessibility** — axe runs at WCAG 2.2 AA + AAA plus best-practice across
  every screen and three viewports, with nothing disabled.
- **Budgets** — `size-limit` gates the bundle; a Playwright harness measures
  real Core Web Vitals including INP under throttling.
