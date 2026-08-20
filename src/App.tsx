import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from 'react'
import { useDexData } from './lib/useDexData'
import { useOfflineCache } from './lib/useOfflineCache'
import { useSettings } from './lib/useSettings'
import { moveFocus, type Direction } from './lib/focusNav'
import { DeviceShell } from './components/DeviceShell'
import { RegionTabs } from './components/RegionTabs'
import { useFeedback } from './lib/useFeedback'
import { ActiveScreen } from './components/ActiveScreen'
import { ErrorBoundary } from './components/ErrorBoundary'

import { flatEntries as entriesOf } from './lib/format'
import { filterEntries, isFiltering } from './lib/filter'
import { useDocumentTitle } from './lib/useDocumentTitle'
import { useScreenKeys } from './lib/useScreenKeys'
import { useAtBottom, useScrollRestoration } from './lib/useScrollBehaviour'
import { hrefFor, pathFor, readUrl, regionById, regions } from './lib/router'
import type { Route } from './lib/types'

/** Half of the fade: out, swap, back in. Kept in step with the CSS duration. */
const FADE_MS = 110

/** Not every environment implements matchMedia; treat absence as "no preference". */
function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function App() {
  const [route, setRoute] = useState<Route>(readUrl)
  const { regionId, mon: selected, page, area } = route
  const [query, setQuery] = useState('')
  const [activeTypes, setActiveTypes] = useState<string[]>([])
  const [shiny, setShiny] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)

  const { settings, set: setSetting, reset: resetSettings } = useSettings()
  const feedback = useFeedback(settings)
  const screenRef = useRef<HTMLElement | null>(null)
  // The D-pad focuses elements programmatically after a mouse press, which is
  // exactly the case :focus-visible declines to match. This flag lets the ring
  // show for pad navigation without turning it on for every mouse click.
  const [padNav, setPadNav] = useState(false)
  const [fading, setFading] = useState(false)
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(fadeTimer.current), [])

  const region = regionById(regionId)
  const offline = useOfflineCache({ lowBandwidth: settings.lowBandwidth })

  const flatEntries = useMemo(() => entriesOf(region), [region])
  const slugs = useMemo(() => flatEntries.map((e) => e.slug), [flatEntries])
  const { byslug, loaded, failed, failedSlugs, total } = useDexData(slugs)

  /**
   * Every request failed and nothing is cached — the API is unreachable rather
   * than merely slow. Distinguished from a partial failure, which the list
   * reports inline and carries on with.
   */
  const dexUnreachable = total > 0 && failed === total && loaded === 0

  useEffect(() => {
    const onPop = () => setRoute(readUrl())
    addEventListener('popstate', onPop)
    return () => removeEventListener('popstate', onPop)
  }, [])

  const selectedEntry = selected ? (flatEntries.find((e) => e.slug === selected) ?? null) : null
  const selectedMon = selected ? byslug.get(selected) : undefined

  useDocumentTitle(route, region, selectedEntry, selectedMon)

  const { listScroll, returnTo } = useScrollRestoration(screenRef, selected)


  function commit(merged: Route, push: boolean) {
    const path = pathFor(merged)
    if (push) history.pushState({ twindex: true }, '', path)
    else history.replaceState({ twindex: true }, '', path)
    setRoute(merged)
  }

  function go(next: Partial<Route>, { push = true }: { push?: boolean } = {}) {
    const merged = { ...route, ...next }
    const animate = settings.transitions && !settings.reduceMotion && !prefersReducedMotion()

    if (!animate) {
      commit(merged, push)
      return
    }

    // Fade the screen out, swap, fade back. Done with opacity on an element
    // inside the display rather than the View Transitions API, whose snapshots
    // are taken against the viewport and spill outside the device frame.
    clearTimeout(fadeTimer.current)
    setFading(true)
    fadeTimer.current = setTimeout(() => {
      commit(merged, push)
      setFading(false)
    }, FADE_MS)
  }

  /**
   * Held in a ref so `openMon` below can be stable.
   *
   * `go` closes over the current route and settings, so it is a new function
   * every render. Passing it down would change `onSelect` on all 158 memoised
   * cards each time a species arrived, which is exactly the re-render the memo
   * exists to prevent.
   */
  const goRef = useRef(go)
  goRef.current = go

  const openMon = useCallback((slug: string) => {
    listScroll.current = screenRef.current?.scrollTop ?? 0
    returnTo.current = slug
    goRef.current({ page: 'dex', mon: slug })
  }, [])

  function back() {
    if ((history.state as { twindex?: boolean } | null)?.twindex) {
      history.back()
      return
    }
    go({ mon: null, page: selected ? 'dex' : 'menu' }, { push: false })
  }

  function changeRegion(id: string) {
    listScroll.current = 0
    returnTo.current = null
    go({ regionId: id, mon: null, page: 'menu' }, { push: false })
  }

  const visibleEntries = useMemo(
    () => filterEntries(flatEntries, byslug, { query, activeTypes }),
    [flatEntries, byslug, query, activeTypes],
  )

  const filtered = isFiltering({ query, activeTypes })

  const selectedArea = selectedEntry
    ? (region.sections.find((s) => s.entries.some((e) => e.slug === selected))?.label ?? null)
    : null

  const step = useCallback(
    (delta: number) => {
      const pool = visibleEntries.length ? visibleEntries : flatEntries
      const index = pool.findIndex((e) => e.slug === selected)
      const next = pool[(index + delta + pool.length) % pool.length]
      if (!next) return
      returnTo.current = next.slug
      go({ page: 'dex', mon: next.slug }, { push: false })
    },
    // `go` is redeclared every render, so listing it would make this callback
    // change every render too. `route` is here instead: it is the only thing
    // `go` closes over that affects the outcome, and the rule cannot see
    // through the call to work that out.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibleEntries, flatEntries, selected, route],
  )

  /**
   * Where Prev and Next actually go, so those controls can be links with a
   * real destination rather than buttons that compute one on click. Wraps the
   * same pool `step` walks, so the href and the handler always agree.
   */
  const stepHref = (delta: number) => {
    const pool = visibleEntries.length ? visibleEntries : flatEntries
    const index = pool.findIndex((e) => e.slug === selected)
    const next = pool[(index + delta + pool.length) % pool.length]
    return next ? hrefFor(route, { page: 'dex', mon: next.slug }) : hrefFor(route, { page: 'dex' })
  }

  const atBottom = useAtBottom(screenRef, [page, selected, visibleEntries.length])

  function jumpToTop() {
    const screen = screenRef.current
    if (!screen) return
    // Read the target first: a statement beginning with `(` would otherwise be
    // parsed as a call on the previous line's value.
    const first = screen.querySelector<HTMLElement>('.page__bar .btn')
    screen.scrollTop = 0
    first?.focus()
  }

  // Arrow keys move focus around the screen; the D-pad calls the same thing.
  const pad = useCallback(
    (direction: Direction) => {
      setPadNav(true)
      if (moveFocus(screenRef.current, direction)) feedback('move')
    },
    [feedback],
  )

  const confirm = useCallback(() => {
    const active = document.activeElement
    // The resulting click is what sounds, via `onScreenClick` below.
    if (active instanceof HTMLElement && screenRef.current?.contains(active)) active.click()
  }, [])

  /**
   * One blip for every control on the screen, rather than wiring each one up.
   * The D-pad is excluded because it already sounds its own move, and the cry
   * is excluded because the cry is the sound.
   */
  const onScreenClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (!(event.target instanceof Element)) return
      const control = event.target.closest('button, a[href], .switch')
      if (!control || control.closest('.device__controls') || control.classList.contains('cry')) {
        return
      }
      feedback('select')
    },
    [feedback],
  )

  // A real pointer press means the pad is no longer driving.
  useEffect(() => {
    const clear = (event: PointerEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest('.device__controls')) {
        setPadNav(false)
      }
    }
    addEventListener('pointerdown', clear)
    return () => removeEventListener('pointerdown', clear)
  }, [])

  useScreenKeys({
    screenRef,
    feedback,
    canGoBack: Boolean(selected) || page !== 'menu',
    onBack: back,
  })

  function toggleType(type: string) {
    setActiveTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    )
  }

  const screen = (
    <ActiveScreen
      route={route}
      region={region}
      entry={selectedEntry}
      mon={selectedMon}
      failedSlugs={failedSlugs}
      area={selectedArea}
      visibleEntries={visibleEntries}
      byslug={byslug}
      activeTypes={activeTypes}
      query={query}
      shiny={shiny}
      filtered={filtered}
      filterOpen={filterOpen}
      loaded={loaded}
      failed={failed}
      total={total}
      dexUnreachable={dexUnreachable}
      online={offline.online}
      atBottom={atBottom}
      settings={settings}
      offline={offline}
      onGo={(next, areaIndex) =>
        go(areaIndex === undefined ? { page: next } : { page: next, area: areaIndex })
      }
      onBack={back}
      onStep={step}
      prevHref={stepHref(-1)}
      nextHref={stepHref(1)}
      onSelect={openMon}
      onQuery={setQuery}
      onToggleType={toggleType}
      onClearTypes={() => setActiveTypes([])}
      onShiny={setShiny}
      onToggleFilter={() => setFilterOpen((v) => !v)}
      onJumpToTop={jumpToTop}
      onSet={setSetting}
      onReset={resetSettings}
    />
  )

  return (
    <div
      className="app"
      data-skin={region.skin}
      data-typeface={settings.typeface}
      data-text-size={settings.textSize}
      data-contrast={settings.contrast}
      data-reduce-motion={settings.reduceMotion}
      data-shell={settings.shell}
      data-scanlines={settings.scanlines}
      data-glow={settings.glow}
      data-transitions={settings.transitions}
      data-pad-nav={padNav}
      data-fading={fading}
      onClickCapture={onScreenClick}
    >
      <a className="skip-link" href="#screen">
        Skip to the screen
      </a>

      <DeviceShell
        onPad={pad}
        onConfirm={confirm}
        brand={
          settings.shell ? (
            <>
              <p className="device__name">Twin Dex</p>
              <RegionTabs regions={regions} activeId={regionId} onChange={changeRegion} />
            </>
          ) : null
        }
      >
        {/* The landmark and the tab panel have to be two elements. Putting
            role="tabpanel" on <main> replaces its implicit `main` role, so the
            document ends up with no main landmark at all — which is what
            Lighthouse caught and the axe suite did not, because that rule sits
            in axe's best-practice tag rather than under a WCAG success
            criterion. */}
        <main id="screen" tabIndex={-1} className="screen" ref={screenRef}>
          {/* With the shell hidden the tabs would go with it, so they move onto
              the screen rather than leaving the other region unreachable. */}
          {!settings.shell && (
            <div className="screen__tabs">
              <RegionTabs regions={regions} activeId={regionId} onChange={changeRegion} />
            </div>
          )}
          {/* Keyed so a route change remounts the wrapper, which is what
              retriggers the wipe. Also the tab panel the region tabs control. */}
          <div
            id="dex-panel"
            role="tabpanel"
            aria-labelledby={`tab-${region.id}`}
            className="screen__page"
            key={`${page}-${selected ?? area ?? ''}`}
          >
            {/* Inside the keyed wrapper, so a pending chunk fades with the
                screen rather than flashing over it. The fallback repeats the
                wording the dex already uses while it streams, so a slow first
                visit reads as loading rather than as an empty screen. */}
            {/* Keyed on the route so a fault on one screen clears when you
                navigate away, rather than following you around the device. */}
            <ErrorBoundary>
              <Suspense
                fallback={
                  <p className="monpage__body monpage__loading" role="status">
                    Loading…
                  </p>
                }
              >
                {screen}
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>
      </DeviceShell>
    </div>
  )
}
