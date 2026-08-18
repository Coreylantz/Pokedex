import { lazy } from 'react'
import { DexScreen } from './DexScreen'
import { ErrorScreen } from './ErrorScreen'
import { MenuScreen } from './MenuScreen'
import { dexNumber, monName } from '../lib/format'
import { hrefFor } from '../lib/router'
import type { DexEntry, Page, Pokemon, Region, Route } from '../lib/types'

/**
 * Everything past the menu and the list is loaded on demand.
 *
 * The menu is the landing screen and the dex grid is one tap away, so both
 * stay in the entry chunk. The entry page, region write-up, area page and
 * settings are all somewhere you choose to go, and each is dead weight on a
 * first paint that only ever shows three tiles. The service worker precaches
 * every chunk, so this costs nothing offline and one cheap request on a first
 * visit.
 */
const PokemonPage = lazy(() => import('./PokemonPage').then((m) => ({ default: m.PokemonPage })))
const RegionInfo = lazy(() => import('./RegionInfo').then((m) => ({ default: m.RegionInfo })))
const AreaScreen = lazy(() => import('./AreaScreen').then((m) => ({ default: m.AreaScreen })))
const SettingsScreen = lazy(() =>
  import('./SettingsScreen').then((m) => ({ default: m.SettingsScreen })),
)

export interface ActiveScreenProps {
  route: Route
  region: Region
  entry: DexEntry | null
  mon: Pokemon | undefined
  /** Which slugs failed outright, so a dead entry shows an error not a spinner. */
  failedSlugs: ReadonlySet<string>
  area: string | null

  visibleEntries: readonly DexEntry[]
  byslug: ReadonlyMap<string, Pokemon>
  availableTypes: readonly string[]
  activeTypes: readonly string[]
  query: string
  shiny: boolean
  filtered: boolean
  filterOpen: boolean
  loaded: number
  failed: number
  total: number
  dexUnreachable: boolean
  online: boolean
  atBottom: boolean

  settings: import('../lib/types').Settings
  offline: ReturnType<typeof import('../lib/useOfflineCache').useOfflineCache>

  onGo: (page: Page, area?: number) => void
  onBack: () => void
  onStep: (delta: number) => void
  prevHref: string
  nextHref: string
  onSelect: (slug: string) => void
  onQuery: (query: string) => void
  onToggleType: (type: string) => void
  onClearTypes: () => void
  onShiny: (shiny: boolean) => void
  onToggleFilter: () => void
  onJumpToTop: () => void
  onSet: ActiveScreenSetter
  onReset: () => void
}

type ActiveScreenSetter = <K extends keyof import('../lib/types').Settings>(
  key: K,
  value: import('../lib/types').Settings[K],
) => void

/**
 * Picks the screen for the current route.
 *
 * Its own component rather than a chain inside App: as an inline if/else ladder
 * it was most of why App scored 26 on cognitive complexity against a limit of
 * 15, because every branch is charged again for the component enclosing it.
 * Out here the chain is flat and reads as what it is — a routing table.
 *
 * Order matters. The two failure cases come first, because an entry that could
 * not be read and a dex that could not be reached both have to win over the
 * screens that would otherwise render empty and claim everything is fine.
 */
export function ActiveScreen(props: ActiveScreenProps) {
  const { route, region, entry, failedSlugs } = props
  const { page } = route

  /*
   * Real URLs for every navigating control, so each can be a link rather than
   * a button. They are derived from the current route, which is what keeps a
   * link's href and the click handler describing the same destination.
   */
  const href = {
    menu: hrefFor(route, { page: 'menu', mon: null, area: null }),
    dex: hrefFor(route, { page: 'dex', mon: null, area: null }),
    region: hrefFor(route, { page: 'region', mon: null, area: null }),
    settings: hrefFor(route, { page: 'settings', mon: null, area: null }),
    entry: (slug: string) => hrefFor(route, { page: 'dex', mon: slug, area: null }),
    area: (index: number) => hrefFor(route, { page: 'area', area: index, mon: null }),
    page: (target: Page, index?: number) =>
      hrefFor(route, { page: target, area: index ?? null, mon: null }),
  }

  if (entry && failedSlugs.has(entry.slug)) {
    return (
      <ErrorScreen
        title="Entry unreadable"
        detail={`${monName(entry, undefined)} could not be read from the species archive. The rest of the dex is unaffected.`}
        code={`Nº ${dexNumber(entry.regionalNo)} · ${entry.slug}`}
        onBack={props.onBack}
      />
    )
  }

  if (entry) {
    return (
      <PokemonPage
        entry={entry}
        mon={props.mon}
        region={region}
        area={props.area}
        shiny={props.shiny}
        backHref={href.dex}
        prevHref={props.prevHref}
        nextHref={props.nextHref}
        onBack={props.onBack}
        onStep={props.onStep}
      />
    )
  }

  if (page === 'region') {
    return (
      <RegionInfo
        region={region}
        menuHref={href.menu}
        areaHref={href.area}
        onBack={() => props.onGo('menu')}
        onOpenArea={(index) => props.onGo('area', index)}
      />
    )
  }

  if (page === 'area') {
    const section = route.area !== null ? region.sections[route.area] : undefined
    if (section) {
      return (
        <AreaScreen
          region={region}
          section={section}
          backHref={href.region}
          onBack={() => props.onGo('region')}
        />
      )
    }
  }

  if (page === 'settings') {
    return (
      <SettingsScreen
        settings={props.settings}
        onSet={props.onSet}
        onReset={props.onReset}
        onBack={() => props.onGo('menu')}
        backHref={href.menu}
        offline={props.offline}
      />
    )
  }

  if (page === 'dex' && props.dexUnreachable) {
    // Nothing arrived at all. Showing an empty grid with a small note would
    // read as "this region has no Pokemon", which is a worse lie than an error.
    return (
      <ErrorScreen
        title={props.online ? 'No answer' : 'Offline'}
        detail={
          props.online
            ? 'The species archive did not respond, so no entries could be read. It is usually back within a minute.'
            : 'There is no connection, and this dex has not been saved for offline use yet. Entries you have already opened are still available.'
        }
        code={`${region.name} · 0 of ${dexNumber(props.total)} read`}
        onRetry={() => location.reload()}
        onBack={() => props.onGo('menu')}
      />
    )
  }

  if (page === 'dex') {
    return (
      <DexScreen
        region={region}
        entries={props.visibleEntries}
        byslug={props.byslug}
        shiny={props.shiny}
        filtered={props.filtered}
        filterOpen={props.filterOpen}
        onToggleFilter={props.onToggleFilter}
        query={props.query}
        onQuery={props.onQuery}
        availableTypes={props.availableTypes}
        activeTypes={props.activeTypes}
        onToggleType={props.onToggleType}
        onClearTypes={props.onClearTypes}
        onShiny={props.onShiny}
        loaded={props.loaded}
        failed={props.failed}
        total={props.total}
        atBottom={props.atBottom}
        onJumpToTop={props.onJumpToTop}
        onSelect={props.onSelect}
        entryHref={href.entry}
        menuHref={href.menu}
        onBack={() => props.onGo('menu')}
      />
    )
  }

  return (
    <MenuScreen
      region={region}
      hrefFor={(target) => href.page(target)}
      onOpen={(next) => props.onGo(next)}
    />
  )
}
