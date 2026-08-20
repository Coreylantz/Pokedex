import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { dexNumber, idSafe, monName, spriteFor, titleCase } from '../lib/format'
import { PixelIcon } from './PixelIcon'
import { NavLink } from './NavLink'

import type { DexEntry, Pokemon, Region } from '../lib/types'

interface PokemonPageProps {
  entry: DexEntry
  /** Undefined until the species record arrives. */
  mon: Pokemon | undefined
  region: Region
  /** The area label this entry is registered in, if known. */
  area: string | null
  shiny: boolean
  backHref: string
  prevHref: string
  nextHref: string
  onBack: () => void
  onStep: (delta: number) => void
}

const MAX_BASE_STAT = 255

/**
 * A real page rather than an overlay: it owns the URL, back returns to the
 * list, and focus moves to the heading as it would after a navigation. Laid
 * out the way the handheld games print an entry, imperial units included.
 *
 * Escape is deliberately not handled here — App owns one window-level handler,
 * and a second would bubble into it and pop two history entries.
 */
export function PokemonPage({
  entry,
  mon,
  region,
  area,
  shiny,
  backHref,
  prevHref,
  nextHref,
  onBack,
  onStep,
}: PokemonPageProps) {
  const headingRef = useRef<HTMLHeadingElement | null>(null)
  const statsId = useId()
  const cryRef = useRef<HTMLAudioElement | null>(null)
  // A present URL is not guaranteed to resolve, so the button disappears the
  // moment the audio proves unplayable.
  const [cryBroken, setCryBroken] = useState(false)
  const [crying, setCrying] = useState(false)

  useEffect(() => {
    setCryBroken(false)
    setCrying(false)
  }, [entry.slug])

  /** The cry plays on demand only — never on arriving at an entry. */
  function playCry() {
    if (!mon?.cry) return
    cryRef.current ??= new Audio()
    const audio = cryRef.current
    const stop = () => setCrying(false)
    audio.onended = stop
    audio.onpause = stop
    audio.onerror = () => {
      stop()
      setCryBroken(true)
    }
    audio.src = mon.cry
    // The cartridge cries are mastered loud.
    audio.volume = 0.35
    audio.currentTime = 0
    audio
      .play()
      .then(() => setCrying(true))
      .catch(() => {
        stop()
        setCryBroken(true)
      })
  }

  // Without this a screen reader hears content swap silently rather than a
  // navigation.
  useEffect(() => {
    headingRef.current?.focus()
  }, [entry.slug])

  const name = monName(entry, mon)
  const sprite = spriteFor(mon, shiny)

  return (
    <article className="monpage">
      <div className="monpage__bar">
        <NavLink className="btn" href={backHref} onNavigate={onBack}>
          Dex
        </NavLink>
        <p className="monpage__crumb">
          {region.name} Nº {dexNumber(entry.regionalNo)}
        </p>
        <div className="monpage__step">
          <NavLink className="btn btn--sm" href={prevHref} onNavigate={() => onStep(-1)}>
            Prev
          </NavLink>
          <NavLink className="btn btn--sm" href={nextHref} onNavigate={() => onStep(1)}>
            Next
          </NavLink>
        </div>
      </div>

      <header className="monpage__head">
        <div className="monpage__art">
          {sprite ? (
            <img
              className="sprite monpage__sprite"
              src={sprite}
              alt={`${shiny ? 'Shiny ' : ''}${name} sprite`}
              width="96"
              height="96"
              decoding="async"
            />
          ) : (
            <span className="dex-card__skeleton" aria-hidden="true" />
          )}
        </div>

        <div className="monpage__id">
          <h1 className="monpage__title" ref={headingRef} tabIndex={-1}>
            {name}
          </h1>
          {mon?.genus && <p className="monpage__genus">{mon.genus}</p>}
          <p className="monpage__national">National Nº {dexNumber(entry.nationalNo)}</p>
          {mon?.cry && !cryBroken && (
            <p>
              {/* The icon reports what the button is doing: a speaker at rest,
                  a waveform while the cry is actually sounding. */}
              <button
                type="button"
                className="btn btn--sm cry"
                data-playing={crying}
                onClick={playCry}
              >
                <PixelIcon name={crying ? 'sounding' : 'sound'} />
                {crying ? 'Playing' : 'Cry'}
              </button>
            </p>
          )}
          {mon && (
            <ul className="monpage__types">
              {mon.types.map((type) => (
                <li key={type}>
                  <span className="type-pill type-pill--lg" data-type={type}>
                    {titleCase(type)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>

      {mon ? (
        <div className="monpage__body">
          {mon.flavourText && <p className="monpage__flavour">{mon.flavourText}</p>}

          <dl className="monpage__measures">
            <div>
              <dt>HT</dt>
              <dd>
                {mon.heightImperial}{' '}
                <span className="monpage__metric">({mon.heightM.toFixed(1)} m)</span>
              </dd>
            </div>
            <div>
              <dt>WT</dt>
              <dd>
                {mon.weightImperial}{' '}
                <span className="monpage__metric">({mon.weightKg.toFixed(1)} kg)</span>
              </dd>
            </div>
          </dl>

          {area && (
            <p className="monpage__area">
              <span className="monpage__area-label">Area</span> {area}
            </p>
          )}

          <section aria-labelledby="stats-head">
            <h2 id="stats-head" className="monpage__subhead">
              Base stats
            </h2>
            <dl className="stats">
              {mon.stats.map((stat) => {
                const labelId = `${statsId}-${idSafe(stat.name)}`
                return (
                  <div className="stats__row" key={stat.name}>
                    <dt className="stats__name" id={labelId}>
                      {stat.name}
                    </dt>
                    {/* The meter nests inside the `dd` rather than sitting
                        beside it. A row of a `dl` may hold only `dt` and `dd`,
                        and giving a `dd` an ARIA role replaces its implicit
                        one — so a sibling meter breaks the pairing either way.
                        It is a gauge, not decoration: the bar carries the
                        reading relative to the maximum, which the bare number
                        does not. */}
                    <dd className="stats__value">
                      <span className="stats__number">{stat.value}</span>
                      <div
                        className="stats__bar"
                        role="meter"
                        aria-labelledby={labelId}
                        aria-valuenow={stat.value}
                        aria-valuemin={0}
                        aria-valuemax={MAX_BASE_STAT}
                        aria-valuetext={`${stat.value} of ${MAX_BASE_STAT}`}
                        style={
                          { '--fill': `${(stat.value / MAX_BASE_STAT) * 100}%` } as CSSProperties
                        }
                      />
                    </dd>
                  </div>
                )
              })}
            </dl>
          </section>
        </div>
      ) : (
        <p className="monpage__body monpage__loading">Loading entry…</p>
      )}
    </article>
  )
}
