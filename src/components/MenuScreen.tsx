import { dexNumber } from '../lib/format'
import { PixelIcon, type IconName } from './PixelIcon'
import type { Page, Region } from '../lib/types'

const ITEMS: { page: Page; icon: IconName; label: string }[] = [
  { page: 'dex', icon: 'pokemon', label: 'Pokémon' },
  { page: 'region', icon: 'region', label: 'Region' },
  { page: 'settings', icon: 'settings', label: 'Settings' },
]

export function MenuScreen({
  region,
  onOpen,
}: {
  region: Region
  onOpen: (page: Page) => void
}) {
  return (
    <div className="menu">
      <header className="menu__head">
        <p className="menu__eyebrow">Regional Pokédex</p>
        <h1 className="menu__title">{region.name}</h1>
        <p className="menu__count">{dexNumber(region.count)} entries registered</p>
      </header>

      <nav aria-label="Main menu">
        <ul className="menu__grid">
          {ITEMS.map((item) => (
            <li key={item.page}>
              <button type="button" className="tile" onClick={() => onOpen(item.page)}>
                <PixelIcon name={item.icon} />
                <span className="tile__label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
