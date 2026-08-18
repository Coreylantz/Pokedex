import { dexNumber, dexRange } from '../lib/format'
import type { Region, Section } from '../lib/types'

/**
 * One area's write-up. Deliberately information only — the Pokemon live in the
 * Pokedex, and duplicating the list here would just be a second dex with a
 * worse name.
 */
export function AreaScreen({
  region,
  section,
  onBack,
}: {
  region: Region
  section: Section
  onBack: () => void
}) {
  const { first, last } = dexRange(section)

  return (
    <div className="page">
      <div className="page__bar">
        <button type="button" className="btn" onClick={onBack}>
          Region
        </button>
        <p className="page__crumb">{region.name} Area</p>
      </div>

      <h1 className="page__title">{section.label}</h1>
      <p className="page__blurb">{section.note}</p>

      <dl className="factlist">
        <div>
          <dt>Dex range</dt>
          <dd>
            Nº {dexNumber(first.regionalNo)} – {dexNumber(last.regionalNo)}
          </dd>
        </div>
        <div>
          <dt>Registered here</dt>
          <dd>{section.entries.length} entries</dd>
        </div>
      </dl>
    </div>
  )
}
