import { useId, useState, type FormEvent } from 'react'
import { ALL_TYPES } from '../lib/filter'
import { titleCase } from '../lib/format'
import { PixelIcon } from './PixelIcon'

interface DexToolbarProps {
  id: string
  query: string
  onQuery: (query: string) => void
  activeTypes: readonly string[]
  onToggleType: (type: string) => void
  onClearTypes: () => void
  shiny: boolean
  onShiny: (shiny: boolean) => void
}

/**
 * The search and filter panel. The toggle that opens it lives up in the page
 * bar, so this is only ever the panel itself.
 *
 * The text query is committed on submit rather than on every keystroke: typing
 * a name should not re-sort the list from under you letter by letter.
 */
export function DexToolbar({
  id,
  query,
  onQuery,
  activeTypes,
  onToggleType,
  onClearTypes,
  shiny,
  onShiny,
}: DexToolbarProps) {
  const [draft, setDraft] = useState(query)
  const searchId = useId()
  const filtered = query.trim() !== '' || activeTypes.length > 0

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onQuery(draft)
  }

  function clearAll() {
    setDraft('')
    onQuery('')
    onClearTypes()
  }

  return (
    <div className="finder__panel" id={id}>
      <form className="finder__form" onSubmit={submit} role="search">
        <label className="finder__label" htmlFor={searchId}>
          Name or number
        </label>
        <div className="finder__row">
          <input
            id={searchId}
            className="finder__input"
            type="search"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoComplete="off"
            spellCheck="false"
          />
          <button type="submit" className="btn btn--icon btn--primary">
            <PixelIcon name="search" />
            <span className="visually-hidden">Search</span>
          </button>
        </div>
      </form>

      <fieldset className="finder__types">
        <legend className="finder__label">Type</legend>
        <div className="type-chips">
          {ALL_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className="type-chip"
              data-type={type}
              aria-pressed={activeTypes.includes(type)}
              onClick={() => onToggleType(type)}
            >
              {titleCase(type)}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="finder__foot">
        <label className="switch">
          <input type="checkbox" checked={shiny} onChange={(e) => onShiny(e.target.checked)} />
          <span className="switch__track" aria-hidden="true" />
          <span>Shiny</span>
        </label>
        <button type="button" className="btn" onClick={clearAll} disabled={!filtered}>
          Clear
        </button>
      </div>
    </div>
  )
}
