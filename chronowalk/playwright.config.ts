import { defineConfig, devices } from '@playwright/test'

/**
 * Landing funnel analytics e2e.
 * Stub strategy: patch window.posthog.capture after posthog-js init (same singleton
 * the module import uses).
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  timeout: 90_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      VITE_POSTHOG_KEY: process.env.VITE_POSTHOG_KEY || 'phc_playwright_analytics_test',
      VITE_MAPBOX_TOKEN: process.env.VITE_MAPBOX_TOKEN || '',
      VITE_PADDLE_CLIENT_TOKEN: process.env.VITE_PADDLE_CLIENT_TOKEN || '',
    },
  },
  projects: [
    {
      name: 'chromium-mobile',
      use: {
        browserName: 'chromium',
        ...devices['Pixel 7'],
      },
    },
  ],
})
