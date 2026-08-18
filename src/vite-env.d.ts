/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
/// <reference types="unplugin-icons/types/react" />

/**
 * The Network Information API. Still not in lib.dom, and only the one field
 * this app reads is declared — `saveData`, which is how a device says it is on
 * a metered or capped connection.
 */
interface NetworkInformation {
  readonly saveData?: boolean
}

interface Navigator {
  readonly connection?: NetworkInformation
}

/** Collected in the page by scripts/vitals.ts, read back over CDP. */
interface Window {
  __vitals?: { LCP?: number; INP?: number; CLS?: number; TTFB?: number }
}

/**
 * `subset-font` ships no types. Declaring only the call this repo makes is
 * more useful than `any`: it keeps the argument order and the return type
 * checked at the one place it is used.
 */
declare module 'subset-font' {
  export default function subsetFont(
    font: Buffer,
    text: string,
    options?: { targetFormat?: 'sfnt' | 'woff' | 'woff2' },
  ): Promise<Buffer>
}
