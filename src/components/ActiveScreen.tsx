import { lazy } from 'react'
import { DexScreen } from './DexScreen'
import { ErrorScreen } from './ErrorScreen'
import { MenuScreen } from './MenuScreen'
import { dexNumber, monName } from '../lib/format'
import { hrefFor } from '../lib/router'
import type { DexEntry, Page, Pokemon, Region, Route } from '../lib/types'

/**
 * The menu and grid stay in the entry chunk; everything you choose to navigate
 * to is dead weight on a first paint of three tiles. The SW precaches every
 * chunk, so this costs nothing offline.
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
 * Its own component rather than a ladder inside App, which scored 26 on
 * cognitive complexity against a limit of 15 — every branch is charged again
 * for its enclosing component.
 *
 * Order matters: the failure cases come first, or the screens below render
 * empty and claim everything is fine.
 */
export function ActiveScreen(props: ActiveScreenProps) {
  const { route, region, entry, failedSlugs } = props
  const { page } = route

  // Derived from the current route, which is what keeps each href and its
  // click handler describing the same destination.
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
    // An empty grid would read as "this region has no Pokemon" — a worse lie
    // than an error.
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
