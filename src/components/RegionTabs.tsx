import { useRef, type KeyboardEvent } from 'react'
import type { Region } from '../lib/types'

/**
 * Which tab each key moves to, given the current index and the last one.
 *
 * A table rather than a chain of conditions: the branching version scored 21
 * on cognitive complexity against a limit of 15, almost all of it from nested
 * ternaries inside an if/else ladder. As data, the wrapping rules are visible
 * at a glance and the handler below is four lines.
 */
const MOVES: Record<string, (index: number, last: number) => number> = {
  ArrowRight: (index, last) => (index === last ? 0 : index + 1),
  ArrowDown: (index, last) => (index === last ? 0 : index + 1),
  ArrowLeft: (index, last) => (index === 0 ? last : index - 1),
  ArrowUp: (index, last) => (index === 0 ? last : index - 1),
  Home: () => 0,
  End: (_index, last) => last,
}

/**
 * Region switcher built as a proper ARIA tablist: arrow keys move between
 * regions, Home/End jump to the ends, and only the active tab is tabbable.
 *
 * Auto-activating — an arrow key switches region immediately rather than
 * requiring Enter. There are only two regions and switching is cheap and
 * reversible, which is the condition the ARIA practices guide gives for
 * preferring it; manual activation would add a keystroke to every switch.
 *
 * There is one panel, not one per tab: the screen is reused, so every tab
 * points at the same `dex-panel` element. That panel sits inside `<main>`
 * rather than being it — `role="tabpanel"` on the landmark would replace the
 * landmark.
 */
export function RegionTabs({
  regions,
  activeId,
  onChange,
}: {
  regions: Region[]
  activeId: string
  onChange: (id: string) => void
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const move = MOVES[event.key]
    if (!move) return

    const index = regions.findIndex((r) => r.id === activeId)
    const target = regions[move(index, regions.length - 1)]
    if (!target) return

    event.preventDefault()
    onChange(target.id)
    refs.current[regions.indexOf(target)]?.focus()
  }

  return (
    <div className="region-tabs" role="tablist" aria-label="Choose a region" onKeyDown={onKeyDown}>
      {regions.map((region, i) => {
        const selected = region.id === activeId
        return (
          <button
            key={region.id}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="tab"
            id={`tab-${region.id}`}
            aria-selected={selected}
            aria-controls="dex-panel"
            tabIndex={selected ? 0 : -1}
            className="region-tab"
            onClick={() => onChange(region.id)}
          >
            <span className="region-tab__name">{region.name}</span>
            <span className="region-tab__count">{region.count} entries</span>
          </button>
        )
      })}
    </div>
  )
}
