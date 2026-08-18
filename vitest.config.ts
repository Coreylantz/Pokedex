import { defineConfig, defineProject } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import Icons from 'unplugin-icons/vite'
import { playwright } from '@vitest/browser-playwright'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'

const dir = dirname(fileURLToPath(import.meta.url))

/**
 * Two test projects, because they answer different questions.
 *
 * `unit` is the jsdom suite: routing, formatting, data invariants — logic that
 * never needs a renderer, and is far faster without one.
 *
 * `stories` runs every Storybook story in a real Chromium. That is the whole
 * point of it: focus rings and `:focus-visible`, computed colour and contrast,
 * sequential keyboard navigation, `content-visibility`, real layout, and the
 * axe checks that depend on all of them. jsdom either stubs those or does not
 * implement them, so asserting them there would be asserting nothing.
 */
export default defineConfig({
  test: {
    projects: [
      defineProject({
        // Icons here too: App.test.tsx mounts the whole app, which reaches
        // PixelIcon and its `~icons/...` virtual imports. Without the plugin
        // the suite fails to resolve them rather than failing an assertion.
        plugins: [react(), Icons({ compiler: 'jsx', jsx: 'react' })],
        test: {
          name: 'unit',
          environment: 'jsdom',
          globals: false,
          include: ['src/**/*.test.{js,ts,tsx}'],
        },
      }),

      defineProject({
        plugins: [
          react(),
          // Stories import the same icon components the app does.
          Icons({ compiler: 'jsx', jsx: 'react' }),
          storybookTest({ configDir: resolve(dir, '.storybook') }),
        ],
        test: {
          name: 'stories',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
          setupFiles: [resolve(dir, '.storybook/vitest.setup.ts')],
        },
      }),
    ],
  },
})
