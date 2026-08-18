/**
 * Physical-like native fidelity screenshots at iPhone viewports.
 * Uses DEV nativePreview so the browser renders native routes.
 */
import { expect, test, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const VIEWPORTS = [
  { name: '390x844', width: 390, height: 844 },
  { name: '393x852', width: 393, height: 852 },
  { name: '430x932', width: 430, height: 932 },
]

async function dismissCookies(page: Page) {
  const banner = page.getByTestId('analytics-consent-banner')
  try {
    await banner.waitFor({ state: 'visible', timeout: 2500 })
    await page.getByTestId('analytics-consent-accept').click()
    await expect(banner).toHaveCount(0, { timeout: 4000 })
  } catch {
    /* already dismissed */
  }
}

async function shot(page: Page, dirs: string[], name: string) {
  await dismissCookies(page)
  await page.waitForTimeout(280)
  for (const dir of dirs) {
    await page.screenshot({ path: resolve(dir, `${name}.png`), fullPage: false })
  }
}

test.describe('T05.2 native fidelity screenshots', () => {
  test.describe.configure({ mode: 'serial' })
  test.use({
    geolocation: { latitude: 41.89885, longitude: 12.47687 },
    permissions: ['geolocation'],
  })

  for (const vp of VIEWPORTS) {
    test(`capture ${vp.name}`, async ({ page }) => {
      test.setTimeout(180_000)
      const dirs = [
        resolve('/opt/cursor/artifacts/screenshots', `t05-fidelity-${vp.name}`),
        resolve(process.cwd(), 'artifacts/t05-fidelity', vp.name),
      ]
      for (const dir of dirs) mkdirSync(dir, { recursive: true })

      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.addInitScript(() => {
        localStorage.setItem('cw_dev_native_preview', '1')
        localStorage.setItem('cw_marketing_consent', 'declined')
        localStorage.setItem('cw_analytics_consent', 'declined')
        localStorage.removeItem('cw_guest_v1')
        localStorage.removeItem('cw_route_v1')
      })

      await page.goto('/welcome?nativePreview=1')
      await dismissCookies(page)
      await expect(page.getByTestId('native-welcome')).toBeVisible({ timeout: 20_000 })
      await shot(page, dirs, '01-welcome')

      await page.getByTestId('native-welcome-start').click()
      await expect(page.getByTestId('native-context')).toBeVisible({ timeout: 15_000 })
      await shot(page, dirs, '02-context-interests')

      await page.getByTestId('native-context-interest-architecture-design').click()
      await page.getByTestId('native-context-interests-continue').click()

      const refineSkip = page.getByTestId('native-context-refine-skip')
      if (await refineSkip.isVisible().catch(() => false)) {
        await shot(page, dirs, '02-context-refine')
        await refineSkip.click()
      }

      await expect(page.getByTestId('native-context-style-continue')).toBeVisible()
      await page.getByTestId('native-context-style-iconic-hidden').click()
      await shot(page, dirs, '02-context-style')
      await page.getByTestId('native-context-style-continue').click()

      await expect(page.getByTestId('native-context-mobility-continue')).toBeVisible()
      await shot(page, dirs, '02-context-mobility')
      await page.getByTestId('native-context-mobility-continue').click()

      await page.getByTestId('native-context-trip-horizon-today').click()
      await shot(page, dirs, '02-context-trip')
      await page.getByTestId('native-context-trip-continue').click()

      await page.getByTestId('native-context-time-1h').click()
      await shot(page, dirs, '02-context-time')
      await page.getByTestId('native-context-time-continue').click()

      await expect(page.getByTestId('native-context-location-skip')).toBeVisible()
      await shot(page, dirs, '02-context-location')
      await page.getByTestId('native-context-location-skip').click()

      await page.waitForURL(/\/plan/)
      await expect(page.getByTestId('plan-title').or(page.getByTestId('native-plan'))).toBeVisible({ timeout: 20_000 })
      await shot(page, dirs, '03-plan')

      await page.goto('/home?nativePreview=1')
      await expect(page.getByTestId('native-discover')).toBeVisible({ timeout: 12_000 })
      await shot(page, dirs, '04-discover-home')

      await page.goto('/route/adjust?nativePreview=1')
      await expect(page.getByTestId('native-adjust')).toBeVisible({ timeout: 12_000 })
      await shot(page, dirs, '05-adjust')

      await page.goto('/plan?nativePreview=1')
      await expect(page.getByTestId('plan-start')).toBeVisible({ timeout: 12_000 })
      await page.getByTestId('plan-start').click()
      await expect(page.getByTestId('native-active-route')).toBeVisible({ timeout: 12_000 })
      await expect(page.getByTestId('route-pill')).toBeVisible({ timeout: 8_000 })
      await shot(page, dirs, '06-active-route')

      await page.goto('/discovery/d_rome_22?nativePreview=1')
      await expect(page.getByTestId('native-discovery')).toBeVisible({ timeout: 12_000 })
      await shot(page, dirs, '07-discovery-detail')

      await page.goto('/next?nativePreview=1')
      await expect(page.getByTestId('native-best-next')).toBeVisible({ timeout: 12_000 })
      await shot(page, dirs, '08-bifurcation')
      await shot(page, dirs, '10-best-next')

      await page.goto('/mystery?nativePreview=1')
      await expect(page.getByTestId('native-mystery')).toBeVisible({ timeout: 12_000 })
      await shot(page, dirs, '09-mystery')

      await page.goto('/map?nativePreview=1')
      await expect(page.getByTestId('native-map')).toBeVisible({ timeout: 12_000 })
      await page.waitForTimeout(2000)
      await shot(page, dirs, '11-map')

      await page.goto('/journal?nativePreview=1')
      await expect(page.getByTestId('native-saved').or(page.getByTestId('saved-empty')).or(page.locator('[data-testid="native-saved"]'))).toBeVisible({
        timeout: 12_000,
      })
      await shot(page, dirs, '12-saved')

      await page.goto('/route?nativePreview=1')
      const controls = page.getByTestId('active-route-controls')
      await expect(controls).toBeVisible({ timeout: 12_000 })
      await controls.click()
      await shot(page, dirs, '13-route-controls')
    })
  }
})
