import { dexNumber, dexRange, pad2 } from '../lib/format'
import { NavLink } from './NavLink'
import type { Region } from '../lib/types'

/**
 * The region's own page: its facts, then its areas as a list you open the same
 * way you open a Pokemon.
 */
export function RegionInfo({
  region,
  menuHref,
  areaHref,
  onBack,
  onOpenArea,
}: {
  region: Region
  menuHref: string
  areaHref: (index: number) => string
  onBack: () => void
  onOpenArea: (index: number) => void
}) {
  return (
    <div className="page">
      <div className="page__bar">
        <NavLink className="btn" href={menuHref} onNavigate={onBack}>
          Menu
        </NavLink>
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
            <NavLink
              className="area__button"
              href={areaHref(index)}
              onNavigate={() => onOpenArea(index)}
            >
              <span className="area__no">{pad2(index + 1)}</span>
              <span className="area__name">{section.label}</span>
              <span className="area__range">{dexRange(section).label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  )
}
