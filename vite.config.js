import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import Icons from 'unplugin-icons/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'

const YEAR = 60 * 60 * 24 * 365

export default defineConfig({
  build: {
    // Lets rollup-plugin-visualizer and any future tooling tell the entry
    // chunk and its static imports apart from lazily-imported route chunks.
    manifest: true,
  },
  // Test config lives in vitest.config.ts, which defines two projects — jsdom
  // for unit tests and a real browser for Storybook stories. A `test` key here
  // would be silently ignored, so it is not left behind to mislead.
  plugins: [
    // Only when asked for: it writes a report and slows the build, and every
    // other build in this repo is one a test or a budget check is waiting on.
    ...(process.env.ANALYZE
      ? [
          visualizer({
            filename: 'reports/bundle.html',
            template: 'treemap',
            gzipSize: true,
            brotliSize: true,
          }),
          // The same data as JSON, so scripts/treeshake.ts can assert on it
          // rather than a human squinting at a treemap.
          visualizer({
            filename: 'reports/bundle.json',
            template: 'raw-data',
            gzipSize: true,
            brotliSize: true,
          }),
        ]
      : []),
    react(),
    // Icons come from the picon set as real components, compiled at build time
    // so only the handful actually used ends up in the bundle — and none of it
    // needs the network.
    Icons({ compiler: 'jsx', jsx: 'react' }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'Twin Dex — Kanata & Anahua Pokédex',
        short_name: 'Twin Dex',
        description:
          'An offline-capable regional Pokédex for the Kanata and Anahua regions, presented on first- and second-generation Pokédex hardware.',
        lang: 'en',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#101626',
        theme_color: '#101626',
        categories: ['games', 'entertainment', 'reference'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Kanata dex', url: '/kanata/pokemon' },
          { name: 'Anahua dex', url: '/anahua/pokemon' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            /*
             * Species data. Cache-first for a year, which deliberately ignores
             * what the origin asks for: PokeAPI sends `max-age=86400`, so
             * without this every entry would refetch daily to receive
             * byte-identical data about species that were finalised decades
             * ago. The dex is immutable; the only reason to refetch is a change
             * to our own region lists, and that ships a new PRIME_KEY.
             *
             * maxEntries has to clear the real working set with room to spare:
             * 330 species x 2 endpoints (/pokemon and /pokemon-species) is 660.
             * The previous 700 left 40 slots of headroom, and Workbox evicts
             * LRU without complaint — so the earliest-cached entries would
             * silently drop out of the offline copy the moment anything else
             * was fetched.
             */
            urlPattern: ({ url }) => url.origin === 'https://pokeapi.co',
            handler: 'CacheFirst',
            options: {
              cacheName: 'pokeapi-v2',
              expiration: { maxEntries: 1000, maxAgeSeconds: YEAR },
              // 200 only. An opaque response would be cached and then be
              // unreadable, which is worse than a miss.
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            /*
             * The sprites, served off PokeAPI's asset host — which sends
             * `max-age=300`. Five minutes is right for a raw file host serving
             * a branch that could move; it is absurd for pixel art that has not
             * changed since 1999, and would make the offline copy expire while
             * you were still looking at it. A year, same reasoning as above.
             *
             * 660 sprites for a full download (330 species, default + shiny).
             *
             * Status 0 has to stay allowed here, unlike on the API route. The
             * sprites are drawn with plain `<img src>`, which is a no-cors
             * request, so the worker sees an opaque response with status 0 —
             * tightening this to [200] to match the API route stops sprites
             * being cached at all, silently, and only shows up as a blank grid
             * once you are offline. e2e/offline.spec.ts is what caught it.
             */
            urlPattern: ({ url }) => url.origin === 'https://raw.githubusercontent.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'poke-sprites',
              expiration: { maxEntries: 1000, maxAgeSeconds: YEAR },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
})
