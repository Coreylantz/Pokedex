import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end tests run against the production build, not the dev server: the
 * service worker, the precache and the built CSS only exist there, and those
 * are exactly the things a unit test in jsdom cannot see.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4318',
    trace: 'retain-on-failure',
    /**
     * The service worker precaches the app shell, which means a rebuilt CSS or
     * JS bundle can be shadowed by the previous one for a load or two. That is
     * correct behaviour in production and pure noise in a UI test, so these
     * talk to the server directly.
     *
     * The `offline` project below overrides this: it is the one place the
     * worker is allowed to run, because it is the thing under test there.
     */
    serviceWorkers: 'block',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, testIgnore: /offline\.spec\.ts/ },
    { name: 'mobile', use: { ...devices['Pixel 5'] }, testIgnore: /offline\.spec\.ts/ },
    {
      name: 'landscape',
      use: { ...devices['Desktop Chrome'], viewport: { width: 900, height: 420 } },
      testIgnore: /offline\.spec\.ts/,
    },
    {
      /**
       * The service worker, actually exercised: precaching, the cache-first
       * runtime routes and their cache lifetime, and a cold start with the
       * network cut. Runs serially and alone — registration is per-origin, so
       * parallel workers would fight over one registration.
       */
      name: 'offline',
      testMatch: /offline\.spec\.ts/,
      fullyParallel: false,
      workers: 1,
      use: { ...devices['Desktop Chrome'], serviceWorkers: 'allow' },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4318 --host 127.0.0.1',
    url: 'http://127.0.0.1:4318',
    reuseExistingServer: true,
    timeout: 180_000,
  },
})
