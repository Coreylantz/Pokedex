import { useRef, type KeyboardEvent } from 'react'
import type { Region } from '../lib/types'

/**
 * A table rather than conditions: the branching version scored 21 on cognitive
 * complexity against a limit of 15, and the wrapping rules were invisible.
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
 * Auto-activating, which the ARIA practices guide permits when switching is
 * cheap and reversible; manual activation would cost a keystroke per switch.
 *
 * One panel for all tabs, since the screen is reused. It sits inside `<main>`
 * rather than being it — `role="tabpanel"` on the landmark would replace it.
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
