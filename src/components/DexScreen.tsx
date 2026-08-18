import { lazy, Suspense } from 'react'
import { DexCard } from './DexCard'
import { PixelIcon } from './PixelIcon'
import { dexNumber } from '../lib/format'
import type { DexEntry, Pokemon, Region } from '../lib/types'

const DexToolbar = lazy(() =>
  import('./DexToolbar').then((m) => ({ default: m.DexToolbar })),
)

interface DexScreenProps {
  region: Region
  /** Already filtered; this component does not decide what is visible. */
  entries: readonly DexEntry[]
  byslug: ReadonlyMap<string, Pokemon>
  shiny: boolean
  filtered: boolean
  filterOpen: boolean
  onToggleFilter: () => void
  query: string
  onQuery: (query: string) => void
  availableTypes: readonly string[]
  activeTypes: readonly string[]
  onToggleType: (type: string) => void
  onClearTypes: () => void
  onShiny: (shiny: boolean) => void
  loaded: number
  failed: number
  total: number
  atBottom: boolean
  onJumpToTop: () => void
  onSelect: (slug: string) => void
  onBack: () => void
}

/**
 * The dex listing: bar, search panel, progress, grid.
 *
 * Split out of App, where it was the largest single block of JSX and most of
 * why that component scored 60 on cognitive complexity against a limit of 15.
 * It owns no state — everything it shows is decided above it — which is what
 * makes it worth having as its own file rather than a function in App.
 */
export function DexScreen({
  region,
  entries,
  byslug,
  shiny,
  filtered,
  filterOpen,
  onToggleFilter,
  query,
  onQuery,
  availableTypes,
  activeTypes,
  onToggleType,
  onClearTypes,
  onShiny,
  loaded,
  failed,
  total,
  atBottom,
  onJumpToTop,
  onSelect,
  onBack,
}: DexScreenProps) {
  const settled = loaded + failed >= total

  return (
    <div className="page">
      <div className="page__bar">
        <button type="button" className="btn" onClick={onBack}>
          Menu
        </button>
        {/* The listing's own heading. Every other screen has an h1 under the
            bar; this one had only a breadcrumb, leaving the page with no
            level-one heading to navigate to. Styled as the crumb it already
            looked like. */}
        <h1 className="page__crumb">{region.name} Pokédex</h1>
        <button
          type="button"
          className="btn btn--icon page__bar-end"
          aria-label={filterOpen ? 'Close search and filter' : 'Search and filter'}
          aria-expanded={filterOpen}
          aria-controls="finder-panel"
          data-on={filtered}
          onClick={onToggleFilter}
        >
          {/* A funnel reads as a thin scratch at this size; a magnifier does
              not, and it is the same panel either way. */}
          <PixelIcon name={filterOpen ? 'close' : 'search'} />
        </button>
      </div>

      {filterOpen && (
        <Suspense fallback={null}>
          <DexToolbar
            id="finder-panel"
            query={query}
            onQuery={onQuery}
            types={availableTypes}
            activeTypes={activeTypes}
            onToggleType={onToggleType}
            onClearTypes={onClearTypes}
            shiny={shiny}
            onShiny={onShiny}
          />
        </Suspense>
      )}

      <p className="finder__results" role="status">
        {filtered ? `${entries.length} of ${region.count} match` : `${region.count} entries`}
      </p>

      {/* Counting failures as settled: without them a single 404 leaves
          "Reading dex data" on screen for good, because `loaded` can never
          reach `total`. */}
      {!settled && (
        <p className="loading-note" role="status">
          Reading dex data… {dexNumber(loaded)} / {dexNumber(total)}
        </p>
      )}

      {settled && failed > 0 && (
        <p className="loading-note" role="status">
          {dexNumber(failed)} entries could not be read
        </p>
      )}

      <ul className="dex-grid">
        {entries.map((entry) => (
          <DexCard
            key={entry.slug}
            entry={entry}
            mon={byslug.get(entry.slug)}
            shiny={shiny}
            onSelect={onSelect}
          />
        ))}
      </ul>

      {entries.length === 0 && <p className="empty">No entries match those filters.</p>}

      {/* Appears once you reach the end of a very long list. */}
      {atBottom && (
        <button type="button" className="to-top" onClick={onJumpToTop}>
          <PixelIcon name="top" />
          Back to top
        </button>
      )}
    </div>
  )
}
