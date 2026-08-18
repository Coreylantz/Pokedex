import type { ReactNode } from 'react'
import type { Direction } from '../lib/focusNav'

const Pad = ({
  direction,
  onPad,
}: {
  direction: Direction
  onPad: (direction: Direction) => void
}) => (
  <button
    type="button"
    tabIndex={-1}
    className={`dpad__btn dpad__btn--${direction}`}
    onClick={() => onPad(direction)}
  />
)

/**
 * The physical Pokedex the dex is displayed on.
 *
 * Both regions render the same chrome and the skin restyles it: Kanata gets the
 * first-generation shell (red body, big blue lens, three lamps, four-shade
 * monochrome screen), Anahua the second-generation one (gold body, silver trim,
 * colour screen).
 *
 * The D-pad and buttons are live. They drive the same focus movement the arrow
 * keys do, so they are a skin over real keyboard support rather than a separate
 * mechanism — which is also why they are hidden from assistive tech and kept
 * out of the tab order. Anyone navigating by keyboard already has the arrows.
 */
export function DeviceShell({
  brand,
  onPad,
  onConfirm,
  children,
}: {
  /** The nameplate, or null when the shell is hidden. */
  brand: ReactNode
  onPad: (direction: Direction) => void
  onConfirm: () => void
  children: ReactNode
}) {
  return (
    <div className="device">
      {/* A header rather than a div: the nameplate and the region tabs are real
          content, and without a landmark around them they are the one part of
          the page a landmark-based reader cannot reach. */}
      <header className="device__top">
        <span className="lens" aria-hidden="true">
          <span className="lens__glint" />
        </span>
        <span className="lamps" aria-hidden="true">
          <span className="lamp lamp--a" />
          <span className="lamp lamp--b" />
          <span className="lamp lamp--c" />
        </span>
        <div className="device__brand">{brand}</div>
      </header>

      <div className="device__bezel">
        <span className="bezel__lamp" aria-hidden="true" />
        <span className="bezel__slots" aria-hidden="true" />
        {children}
      </div>

      {/* Pressing a control must not pull focus out of the screen — the whole
          point of it is to move focus around inside. preventDefault on
          mousedown is what stops the button focusing itself. */}
      <div
        className="device__controls"
        aria-hidden="true"
        onMouseDown={(event) => event.preventDefault()}
      >
        {/* The hub sits between left and right in source order; the grid
            placement in controls.css depends on it. */}
        <div className="dpad">
          <Pad direction="up" onPad={onPad} />
          <Pad direction="left" onPad={onPad} />
          <span className="dpad__hub" />
          <Pad direction="right" onPad={onPad} />
          <Pad direction="down" onPad={onPad} />
        </div>

        <span className="device__seam" />

        <div className="pads">
          <button type="button" tabIndex={-1} className="pad pad--a" onClick={onConfirm} />
          <button type="button" tabIndex={-1} className="pad pad--b" onClick={onConfirm} />
        </div>

        <span className="grille" />
      </div>
    </div>
  )
}
