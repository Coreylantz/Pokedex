import type { SVGProps } from 'react'
import IconMap from '~icons/pixelarticons/map-pin'
import IconCog from '~icons/pixelarticons/settings-cog-2'
import IconMagnifier from '~icons/pixelarticons/search'
import IconClose from '~icons/pixelarticons/close'
import IconUp from '~icons/pixelarticons/arrow-up'
import IconSound from '~icons/pixelarticons/volume-3'
import IconSounding from '~icons/pixelarticons/audio-waveform'

/**
 * Icons from Pixelarticons, pulled in through unplugin-icons. Everything is
 * drawn on a 24px whole-pixel grid with hard edges — no curves, no anti-alias
 * — which is the point on a handheld. Only the icons named here are compiled
 * into the bundle, and none of them touch the network.
 *
 * The Pokeball is the one exception. No open icon set ships one, because it is
 * a trademark, so it is generated from circle maths on the same 24px grid.
 * Hand-placing its pixels produced a squarish blob; deriving them did not.
 */
const BALL =
  'M8 1h8v2h-8zM6 2h2v2h-2zM16 2h2v2h-2zM4 3h2v2h-2zM18 3h2v2h-2zM3 4h1v4h-1zM6 4h1v1h-1zM17 4h1v1h-1zM20 4h1v4h-1zM4 5h1v2h-1zM19 5h1v2h-1zM2 6h1v12h-1zM21 6h1v12h-1zM1 8h1v8h-1zM9 8h6v2h-6zM22 8h1v8h-1zM8 9h1v6h-1zM15 9h1v6h-1zM9 10h1v6h-1zM14 10h1v6h-1zM3 11h5v2h-5zM16 11h5v2h-5zM10 14h4v2h-4zM3 16h1v4h-1zM20 16h1v4h-1zM4 17h1v4h-1zM19 17h1v4h-1zM5 19h2v2h-2zM17 19h2v2h-2zM7 20h1v2h-1zM16 20h1v2h-1zM6 21h1v1h-1zM8 21h8v2h-8zM17 21h1v1h-1z'

function IconPokeball(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" shapeRendering="crispEdges" {...props}>
      <path d={BALL} />
    </svg>
  )
}

const ICONS = {
  pokemon: IconPokeball,
  region: IconMap,
  settings: IconCog,
  search: IconMagnifier,
  close: IconClose,
  top: IconUp,
  sound: IconSound,
  sounding: IconSounding,
}

/** Every icon the app can draw. A typo is now a compile error, not a blank space. */
export type IconName = keyof typeof ICONS

export function PixelIcon({ name, className = '' }: { name: IconName; className?: string }) {
  const Glyph = ICONS[name]
  return <Glyph className={`pixel-icon ${className}`} aria-hidden="true" focusable="false" />
}
