import { memo } from 'react'
import { dexNumber, monName, spriteFor, titleCase } from '../lib/format'
import type { DexEntry, Pokemon } from '../lib/types'

interface DexCardProps {
  entry: DexEntry
  /** Undefined until the species record arrives; the card renders a skeleton. */
  mon: Pokemon | undefined
  shiny: boolean
  explained: boolean
  onSelect: (slug: string) => void
}

/**
 * Memoised because the grid holds 158 of these and the data arrives a species
 * at a time. Without it, every batch of arrivals re-rendered every card,
 * including the 157 whose props had not changed. `onSelect` is stable in App,
 * so the default shallow comparison is enough.
 */
export const DexCard = memo(function DexCard({
  entry,
  mon,
  shiny,
  explained,
  onSelect,
}: DexCardProps) {
  const name = monName(entry, mon)
  const sprite = spriteFor(mon, shiny)
  const action = explained ? 'Explain why it is here.' : 'Open details.'

  /**
   * The accessible name has to start with the text you can see on the card, in
   * the order you see it — number, name, then types. Speech control users say
   * what is written; a name that omitted the visible type pills meant "click
   * Bidoof Normal" matched nothing. Everything past that point is the extra
   * context a screen reader wants and the card cannot show.
   *
   * Lighthouse reports `label-content-name-mismatch` here and axe does not.
   * Both are right: the card uppercases its text in CSS, so the rendered label
   * reads "001 TURTWIG GRASS" while this name says "001 Turtwig Grass".
   * Lighthouse compares case-sensitively; WCAG SC 2.5.3 "Label in Name"
   * explicitly ignores case, which is what axe implements. Writing the name in
   * capitals to satisfy the stricter check would make screen readers spell it
   * out letter by letter, so the case difference stays.
   */
  const types = mon ? mon.types.map(titleCase).join(' ') : ''
  const label = `${dexNumber(entry.regionalNo)} ${name}${types ? ` ${types}` : ''}, regional entry. ${action}`

  return (
    <li className="dex-card">
      <button
        type="button"
        className="dex-card__button"
        data-slug={entry.slug}
        onClick={() => onSelect(entry.slug)}
        aria-label={label}
      >
        <span className="dex-card__row">
          {/* The caught marker the games print in front of a registered entry. */}
          <span className="dex-card__ball" aria-hidden="true" />
          <span className="dex-card__no">{dexNumber(entry.regionalNo)}</span>
        </span>

        <span className="dex-card__art">
          {sprite ? (
            <img
              className="sprite dex-card__sprite"
              src={sprite}
              alt={`${name} sprite`}
              width="96"
              height="96"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span className="dex-card__skeleton" aria-hidden="true" />
          )}
        </span>

        <span className="dex-card__name">{name}</span>

        <span className="dex-card__types">
          {mon
            ? mon.types.map((type) => (
                <span key={type} className="type-pill" data-type={type}>
                  {titleCase(type)}
                </span>
              ))
            : null}
        </span>
      </button>
    </li>
  )
})
