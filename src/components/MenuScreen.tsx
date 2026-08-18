import { dexNumber } from '../lib/format'
import { NavLink } from './NavLink'
import { PixelIcon, type IconName } from './PixelIcon'
import type { Page, Region } from '../lib/types'

const ITEMS: { page: Page; icon: IconName; label: string }[] = [
  { page: 'dex', icon: 'pokemon', label: 'Pokémon' },
  { page: 'region', icon: 'region', label: 'Region' },
  { page: 'settings', icon: 'settings', label: 'Settings' },
]

export function MenuScreen({
  region,
  hrefFor,
  onOpen,
}: {
  region: Region
  hrefFor: (page: Page) => string
  onOpen: (page: Page) => void
}) {
  return (
    <div className="menu">
      <header className="menu__head">
        <h1 className="menu__title">{region.name}</h1>
        <p className="menu__count">{dexNumber(region.count)} entries registered</p>
      </header>

      {/* Links, not buttons: each one goes to another screen and gets its own
          URL. A screen reader announces the two differently, and reading a
          navigation list as buttons misdescribes what will happen. */}
      <nav aria-label="Main menu">
        <ul className="menu__grid">
          {ITEMS.map((item) => (
            <li key={item.page}>
              <NavLink className="tile" href={hrefFor(item.page)} onNavigate={() => onOpen(item.page)}>
                <PixelIcon name={item.icon} />
                <span className="tile__label">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
