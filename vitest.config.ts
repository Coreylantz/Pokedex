import { defineConfig, defineProject } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import Icons from 'unplugin-icons/vite'
import { playwright } from '@vitest/browser-playwright'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'

const dir = dirname(fileURLToPath(import.meta.url))

/**
 * `unit` is the jsdom suite: logic that never needs a renderer, and is far
 * faster without one.
 *
 * `stories` runs every story in a real Chromium, which is the whole point:
 * focus rings, computed contrast, sequential keyboard navigation,
 * `content-visibility` and the axe checks that depend on them. jsdom stubs
 * those or lacks them, so asserting them there asserts nothing.
 */
export default defineConfig({
  test: {
    projects: [
      defineProject({
        // App.test.tsx mounts the whole app, reaching PixelIcon's `~icons/...`
        // virtual imports; without the plugin the suite fails to resolve them.
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
