# Twin Dex — Kanata & Anahua Pokédex

An installable, fully offline-capable regional Pokédex for two fan-made regions,
each shown on the Pokédex hardware of a different generation. All species data
and sprites come from [PokéAPI](https://pokeapi.co).

Two routes: `/` is the ordinary dex, and [`/explained`](/explained) is the same
dex where opening an entry tells you *why* that Pokémon was placed in that
region.

| Region | Inspired by | Hardware | Professor | Entries |
| --- | --- | --- | --- | --- |
| **Kanata** — *The Region of the Long Winter* | Canada | Generation I Pokédex — red shell, blue lens, three lamps, four-shade grey monochrome screen | Professor Maple | 148 |
| **Anahua** — *The Region Where the Sun is Kept* | Mexico | Generation II Pokédex — gold shell, silver trim, colour screen | Professor Ceiba | 163 |

*Kanata* is the St. Lawrence Iroquoian word for "village" that gave Canada its
name. *Anahua* is from **Anáhuac**, the Nahuatl name for the highland valley at
the heart of Mexico.

## Running it

Node 18+ is required. This machine uses a portable Node install at
`C:\Users\Corey\AppData\Local\Programs\node-v24.19.0-win-x64` — prepend that to
`PATH`, or install Node normally.

```sh
npm install
npm run build     # production build into dist/
npm run preview   # serve dist/ at http://127.0.0.1:4173
npm run dev       # dev server (service worker disabled)
npm test          # unit: smoke test + regional-dex structure tests (jsdom)
npm run test:e2e  # end-to-end in real Chromium, across three viewports
npm run diagnose  # type-balance report for both regions
npm run lint
```

The e2e suite runs against the production build, because the service worker,
the precache and the built stylesheet only exist there. It covers what jsdom
structurally cannot — real layout, real scrolling, real focus behaviour — and
found four genuine bugs the unit tests were blind to on its first run. There is
also `e2e/shots.spec.js`, which is not assertions but a way to actually look at
the thing: it writes screenshots of every screen to `shots/`.

The service worker only runs in the production build, so use `preview` (not
`dev`) to exercise installability and offline mode.

## The two skins

The device chrome in `DeviceShell.jsx` is one set of elements restyled per
region off a `data-skin` attribute; the region's `skin` field in the dex data
picks which. Everything on the shell is `aria-hidden` — only the screen carries
content.

Kanata's screen chrome is restricted to four shades, the way the handheld
worked — but the neutral grey LCD rather than the green one, because the green
is genuinely hard to read (darkest-on-lightest is 14.8:1 in grey against the
green screen's 6.5:1). Type badges drop to boxed text on this skin to match.

**Sprites are always full colour, on both skins.** They are the content, not
chrome, and a monochrome dex you cannot identify a Pokémon in is a worse dex.

Sprites are only ever drawn at a whole multiple of their 96px source (96 or
192). Nearest-neighbour scaling to anything in between drops pixel rows and the
art stops looking like pixel art.

Anahua's screen keeps full colour, type swatches and the second generation's
"AREA" page, rendered as the habitat the species belongs to.

## How the dexes are built

`scripts/region-lists.mjs` holds the two hand-authored species lists, grouped
into thematic areas. `npm run build:dex` resolves every slug against the live
PokéAPI and writes `src/data/regions.json`, so national dex numbers are never
hand-typed. The script fails loudly on an unknown slug, a duplicate, or an
alternate form.

Species are drawn from every generation, but only ever **default** forms.
Alternate forms (`vulpix-alola`, `lycanroc-midnight`) are numbered from 10000 up
and 404 on `/pokemon-species`, which would break both the dex numbering and the
detail view. A few *default* forms do carry a suffix — `lycanroc-midday`,
`basculin-red-striped`, `mimikyu-disguised` — and those are fine because they
still map to a real species id. The client resolves the species endpoint from
`pokemon.species.name` rather than the slug, which handles them transparently.

Both lists follow the conventions real regional dexes use:

1. the starter trio first (Grass → Fire → Water), each line complete
2. the early-route staples: bird, rodent, bug
3. the "Pikachu slot" electric line
4. mid-game habitats in roughly the order a player walks through them
5. late-game rarities — fossils, then the pseudo-legendary line
6. legendaries last

Evolution lines are always adjacent and in base → final order, and babies sit
directly in front of the stage they hatch into.

Two further rules, both enforced by `build-dex.mjs` at generation time *and*
asserted in `src/App.test.jsx`:

- **No species appears in both regions.** Each dex is its own ecosystem, so the
  148 + 163 entries are 311 distinct species.
- **A starter line only ever appears in a starters section.** Starters are
  given by a professor, not found on a route. The check covers every starter
  trio from every generation, not just the two in use here.

- **No primates and no kaiju in Kanata.** There are no monkeys or apes north of
  the treeline, and a region built on real northern wildlife has no room for the
  rubber-suit-monster lineage (Nidoking, Rhydon, Aggron, Tyranitar, Gyarados).
  Both sets are explicit in `build-dex.mjs` — nothing in the API records design
  ancestry.

## `/explained`

`/explained` is the same dex, but opening an entry gives the design reasoning
for why that Pokémon is in that region rather than its stats. There is a link
between the two modes in both directions, and the route survives navigation,
reload and offline use.

The text lives in `scripts/rationales.mjs`. **Reasoning is written per evolution
line, not per stage** — nobody puts Bayleef in a region for a different reason
than Chikorita — so it is authored once against the line's base form and every
later stage inherits it. Lines are grouped using PokéAPI's own evolution chains
rather than by hand, so an evolution added to a line later cannot orphan itself.
That is 151 reasons covering 311 species.

The exception is a **form** chosen over its alternatives, which is a separate
decision and gets its own note — Lycanroc Midday over Midnight or Dusk, for
instance. Forms that are merely PokéAPI's name for the only ordinary version of
a species (`mimikyu-disguised`) get nothing extra.

`build-dex.mjs` fails if a line head has no reason, if a reason is written
against an evolved form, if a reason exists for a species no longer in a dex, or
if a variant note is attached to something that is not a variant.

### Criteria and score

Every line must earn its place against at least one of four criteria, and the
target is two. The score is simply how many it meets, and `/explained` shows all
four with the met ones filled in.

| Criterion | Meaning |
| --- | --- |
| **Thematic** | The region's real cultures, myths, stories, industries or institutions |
| **Animal / Fauna** | An animal or plant genuinely tied to the region |
| **Stylistic** | Matches the region's landscape, palette and mood |
| **Mechanics** | Fills a slot a region needs: starter, route staple, type coverage, fossil, pseudo-legendary, legendary |

The build enforces the floor of one, rejects unknown or repeated criteria, and
prints any line scraping in on a single criterion so it can be justified better
or cut. Currently every line in both regions meets at least two.

    Kanata: 150 entries, 72 lines — thematic 47, fauna 41, stylistic 24, mechanics 38
    Anahua: 163 entries, 80 lines — thematic 43, fauna 41, stylistic 41, mechanics 36

The scoring is also a check on the author. An early draft of Kanata sourced
almost every thematic pick from First Nations myth, which is a real part of the
place but nowhere near all of it. Making the criteria explicit made the gap
obvious, and the region now also draws on Group of Seven painting (Sudowoodo),
the maple sugar bush and the *cabane à sucre* (Deerling), the voyageur canoe
routes and Francophone folk culture (Buizel), the Mounted Police and the Musical
Ride (Growlithe), pond hockey (Bergmite), Maritime food culture (Shellder),
mining, logging and hydroelectric industry (Onix, Timburr, Elekid), and Canada
Post's H0H 0H0 (Delibird).

### The Kanata bar

Kanata's reasoning is held to a specific standard: every line must connect to
something genuinely attributed to Canada — an animal strongly associated with
the place, an industry or landscape that defines it, or a story told by a
community that lives there. "It is cold and so is Canada" is not a reason.

That standard drove real changes to the list. The starter is Turtwig because
**Turtle Island** — the Haudenosaunee and Anishinaabe creation story in which
the continent rests on a turtle's back — is the oldest story told about this
land, and Torterra is a turtle carrying a landscape. Marill is the **muskrat**,
who in the same story dives for the handful of earth everything is built on.
The legendaries are anchored in myth told *here*: Zapdos as the **Thunderbird**,
Kyurem as the **Wendigo**, Lugia as **Sedna**, who holds every sea mammal in her
hands. Aggron was cut for being a kaiju and replaced by the Nacli line, for the
salt mine under Lake Huron at Goderich — the largest in the world.

The fire starter is the one slot with no Canadian animal available in any
starter line, so it is justified by theme instead: the Fennekin line is about
tending a flame, and in a region where winter is the antagonist the starter
should be the hearth you keep lit through the dark half of the year. It is the
weakest justification in the region and it is labelled as such in the app.

## Offline behaviour

`vite-plugin-pwa` precaches the app shell — including the self-hosted pixel font
— and adds cache-first runtime routes for `pokeapi.co` and the sprite host. On
the first online visit the app walks all 311 unique species and pulls each one's
data plus both sprite forms through the service worker, showing progress in the
status bar. After that the entire dex — every entry, every sprite, both regions
— works with no network. A partial download is never recorded as complete, so
"available offline" only appears when it is actually true.

Icons are generated as real PNGs by `scripts/build-icons.mjs`, which rasterises
the mark and encodes it with node's built-in `zlib`; no image library needed.

## Accessibility

- Skip link, semantic landmarks, and a real `tablist`/`tabpanel` region switcher
  with arrow / Home / End key support
- Every sprite carries descriptive `alt` text; all device chrome is `aria-hidden`
- On the monochrome screen, text only ever uses the darkest-on-lightest pair
  (14.8:1); the two middle greys stay decorative
- Selecting an entry is a real navigation, not a modal: it replaces the listing
  on the screen, owns the URL, and the browser Back button returns to the list.
  Focus moves to the entry title on arrival and back to the card you came from
  on return, with the list's scroll position restored. ← / → step between
  entries (replacing history rather than stacking it), Escape goes back
- Filter results announced via `role="status"`; stat bars are decorative with the
  numeric value exposed in the `<dd>`
- Per-skin focus-ring colours, since one ring colour cannot work on both a red
  shell and a green screen
- `prefers-reduced-motion` and `prefers-contrast: more` respected — the latter
  drops the screen's scanline texture
- The device is a fixed frame with an internally scrolling screen, but that is
  dropped on short or narrow viewports so nothing becomes unreachable

Typeface is [Silkscreen](https://fonts.google.com/specimen/Silkscreen) by Jason
Kottke, SIL Open Font License 1.1 (`public/fonts/Silkscreen-OFL.txt`),
self-hosted so it survives offline.

Icons are inlined as path data in `PixelIcon.jsx` rather than fetched, for the
same reason. Both sets are MIT and drawn on the same 24px whole-pixel grid, so
they mix without looking mismatched:

- [Pixelarticons](https://pixelarticons.com) by Gerrit Halfmann — gear,
  magnifier, funnel, arrow (`LICENSES/pixelarticons-MIT.txt`)
- [Pixel Icon Library](https://pixeliconlibrary.com) by HackerNoon — globe
  (`LICENSES/pixel-icon-library-MIT.txt`)

The Pokéball is the one exception and is generated in place from circle maths,
because no open icon set ships one — it is a trademark. Hand-placing its pixels
produced a squarish blob, so it is derived rather than drawn.

Pokémon is © Nintendo / Game Freak / The Pokémon Company. Kanata and Anahua are
fan-made regions.
