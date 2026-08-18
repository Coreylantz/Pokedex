import { dexNumber, dexRange, pad2 } from '../lib/format'
import type { Region } from '../lib/types'

/**
 * The region's own page: its facts, then its areas as a list you open the same
 * way you open a Pokemon.
 */
export function RegionInfo({
  region,
  onBack,
  onOpenArea,
}: {
  region: Region
  onBack: () => void
  onOpenArea: (index: number) => void
}) {
  return (
    <div className="page">
      <div className="page__bar">
        <button type="button" className="btn" onClick={onBack}>
          Menu
        </button>
        <p className="page__crumb">Region</p>
      </div>

      <h1 className="page__title">{region.name}</h1>
      <p className="page__tagline">{region.tagline}</p>
      <p className="page__blurb">{region.blurb}</p>

      <dl className="factlist">
        <div>
          <dt>Entries</dt>
          <dd>{dexNumber(region.count)}</dd>
        </div>
        <div>
          <dt>Professor</dt>
          <dd>{region.professor}</dd>
        </div>
        <div>
          <dt>Pokédex model</dt>
          <dd>{region.skin === 'gen1' ? 'Model 001' : 'Model 002'}</dd>
        </div>
      </dl>

      <h2 className="page__subhead">Areas</h2>
      <ul className="area-list">
        {region.sections.map((section, index) => (
          <li className="area" key={section.label}>
            <button type="button" className="area__button" onClick={() => onOpenArea(index)}>
              <span className="area__no">{pad2(index + 1)}</span>
              <span className="area__name">{section.label}</span>
              <span className="area__range">{dexRange(section).label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
