import { memo } from 'react'
import { dexNumber, monName, spriteFor, titleCase } from '../lib/format'
import { NavLink } from './NavLink'
import type { DexEntry, Pokemon } from '../lib/types'

interface DexCardProps {
  entry: DexEntry
  /** Undefined until the species record arrives; the card renders a skeleton. */
  mon: Pokemon | undefined
  shiny: boolean
  href: string
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
  href,
  onSelect,
}: DexCardProps) {
  const name = monName(entry, mon)
  const sprite = spriteFor(mon, shiny)

  return (
    <li className="dex-card">
      {/*
        The accessible name comes from the content, in this order: name, then
        number, then types. No aria-label — an aria-label replaces the visible
        text rather than adding to it, so a speech-control user saying what is
        written on the card would miss, and any drift between the two is
        invisible until someone hits it.

        DOM order is what a screen reader reads, and the name is what you are
        looking for; the number and typing are qualifiers. The visual layout
        keeps the number on top and is arranged by grid areas in dex-list.css,
        so reading order and visual order are free to differ.
      */}
      <NavLink className="dex-card__button" href={href} data-slug={entry.slug} onNavigate={() => onSelect(entry.slug)}>
        <span className="dex-card__name">{name}</span>

        <span className="dex-card__row">
          {/* The caught marker the games print in front of a registered entry. */}
          <span className="dex-card__ball" aria-hidden="true" />
          <span className="dex-card__no">{dexNumber(entry.regionalNo)}</span>
        </span>

        <span className="dex-card__types">
          {mon ? (
            mon.types.map((type) => (
              <span key={type} className="type-pill" data-type={type}>
                {titleCase(type)}
              </span>
            ))
          ) : (
            /*
              A real pill, hidden, rather than an empty box with a guessed
              height. The row is the last thing to gain content, so whatever
              space it fails to reserve is space every card below it jumps by
              when the species arrives.

              Reserving it with a fixed min-height means hard-coding a pill's
              height, which is line-height plus padding plus border, all three
              of which move with the text-size setting. Rendering the pill
              itself and hiding it gets the exact height for free and cannot
              drift from the real thing. The non-breaking space is what gives
              it a line box; an empty span would collapse to its padding.
            */
            <span className="type-pill dex-card__type-ghost" aria-hidden="true">
              {'\u00A0'}
            </span>
          )}
        </span>

        <span className="dex-card__art">
          {sprite ? (
            /*
              Decorative, so the alt is empty. The species name is right there
              in the same link; "Turtwig sprite" after it is the same
              information twice, and on a 158-card grid that doubles the
              reading with nothing gained.
            */
            <img
              className="sprite dex-card__sprite"
              src={sprite}
              alt=""
              width="96"
              height="96"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span className="dex-card__skeleton" aria-hidden="true" />
          )}
        </span>
      </NavLink>
    </li>
  )
})
