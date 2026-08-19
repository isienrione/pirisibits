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
  await page.waitForTimeout(220)
  for (const dir of dirs) {
    await page.screenshot({ path: resolve(dir, `${name}.png`), fullPage: false })
  }
}

async function applyFixture(page: Page, id: string) {
  try {
    await page.waitForFunction(
      () => typeof (window as Window & { __cwApplyProductFixture?: Function }).__cwApplyProductFixture === 'function',
      { timeout: 8_000 },
    )
    await page.evaluate((fixtureId) => {
      ;(window as Window & { __cwApplyProductFixture: (id: string) => void }).__cwApplyProductFixture(fixtureId)
    }, id)
  } catch {
    /* keep the in-flow guest session if DEV fixture API is not mounted */
  }
}

test.describe('T05.3 native screen-contract screenshots', () => {
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
        if (!sessionStorage.getItem('cw_fidelity_boot')) {
          localStorage.removeItem('cw_guest_v1')
          localStorage.removeItem('cw_route_v1')
          sessionStorage.setItem('cw_fidelity_boot', '1')
        }
      })

      await page.goto('/welcome?nativePreview=1')
      await dismissCookies(page)
      await expect(page.getByTestId('native-welcome')).toBeVisible({ timeout: 20_000 })
      await shot(page, dirs, '01-welcome')

      await page.getByTestId('native-welcome-start').click()
      await expect(page.getByTestId('native-context')).toBeVisible({ timeout: 15_000 })
      await shot(page, dirs, '02-interests')

      await page.getByTestId('native-context-interest-history').click()
      await page.getByTestId('native-context-interests-continue').click()
      await expect(page.getByTestId('native-context-refine-skip')).toBeVisible()
      await expect(page.getByTestId('native-context-progress')).toHaveAttribute('data-progress-kind', 'optional')
      await shot(page, dirs, '03-optional-refinement')
      await page.getByTestId('native-context-refine-skip').click()

      await page.getByTestId('native-context-style-exploration-mix').click()
      await page.getByTestId('native-context-style-iconic-hidden').click()
      await page.getByTestId('native-context-style-depth-mix').click()
      await shot(page, dirs, '04-style')
      await page.getByTestId('native-context-style-continue').click()

      await page.getByTestId('native-context-urban-lively').click()
      await shot(page, dirs, '05-mobility')
      await page.getByTestId('native-context-mobility-continue').click()

      await page.getByTestId('native-context-trip-horizon-4-7d').click()
      await shot(page, dirs, '06-trip-horizon')
      await page.getByTestId('native-context-trip-continue').click()

      await page.getByTestId('native-context-time-halfday').click()
      await shot(page, dirs, '07-available-now')
      await page.getByTestId('native-context-time-continue').click()

      await expect(page.getByTestId('native-context-location-skip')).toBeVisible()
      await shot(page, dirs, '08-location')
      await page.getByTestId('native-context-location-skip').click()

      await page.waitForURL(/\/plan/)
      await expect(page.getByTestId('plan-start')).toBeVisible({ timeout: 20_000 })
      await shot(page, dirs, '09-proposed-plan')
      await page.getByTestId('plan-why').click()
      await expect(page.getByTestId('why-this-sheet')).toBeVisible()
      await shot(page, dirs, '10-why-this')
      await page.getByTestId('why-this-close').click()

      await applyFixture(page, 'inRomeFreeGuest')
      await page.goto('/home?nativePreview=1')
      await expect(page.getByTestId('native-discover')).toBeVisible({ timeout: 12_000 })
      await shot(page, dirs, '11-discover-home')

      await page.goto('/plan?nativePreview=1')
      await expect(page.getByTestId('plan-start')).toBeVisible({ timeout: 12_000 })
      await page.getByTestId('plan-start').click()
      await expect(page.getByTestId('native-active-route')).toBeVisible({ timeout: 12_000 })
      await shot(page, dirs, '12-active-route')

      await page.evaluate(() => {
        ;(window as Window & { __cwCompleteCurrentItem?: () => void }).__cwCompleteCurrentItem?.()
      })
      await page.goto('/next?nativePreview=1')
      await expect(page.getByTestId('native-best-next')).toBeVisible({ timeout: 12_000 })
      await shot(page, dirs, '13-bifurcation')
      const compare = page.getByTestId('bifurcation-compare')
      if (await compare.isVisible().catch(() => false)) {
        await compare.click()
        await expect(page.getByTestId('compare-options-sheet')).toBeVisible()
        await shot(page, dirs, '14-compare')
        await page.getByTestId('compare-close').click().catch(() => {})
      } else {
        await shot(page, dirs, '14-compare')
      }
      await shot(page, dirs, '23-best-next')

      await page.goto('/experience/w17?nativePreview=1')
      await expect(page.getByTestId('native-experience')).toBeVisible({ timeout: 12_000 })
      await shot(page, dirs, '15-hero-preview')
      await page.getByTestId('experience-start').click()
      await page.waitForTimeout(900)
      await shot(page, dirs, '18-hero-player-shell')
      await shot(page, dirs, '19-reveal-shell')

      await page.goto('/walk?nativePreview=1')
      await expect(page.getByTestId('native-walk')).toBeVisible({ timeout: 12_000 })
      await shot(page, dirs, '16-walk')

      await page.goto('/arrive?nativePreview=1')
      await expect(page.getByTestId('native-arrive')).toBeVisible({ timeout: 12_000 })
      await shot(page, dirs, '17-arrival')

      await applyFixture(page, 'mysteryUnrevealed')
      await page.goto('/mystery?nativePreview=1')
      await expect(page.getByTestId('native-mystery')).toBeVisible({ timeout: 12_000 })
      await shot(page, dirs, '20-mystery-front')
      await page.getByTestId('mystery-reveal').click()
      await expect(page.getByTestId('mystery-card-back')).toBeVisible()
      await shot(page, dirs, '21-mystery-back')

      await page.goto('/discovery/d_rome_22?nativePreview=1')
      await expect(page.getByTestId('native-discovery')).toBeVisible({ timeout: 12_000 })
      await shot(page, dirs, '22-discovery-detail')

      await page.goto('/map?nativePreview=1')
      await expect(page.getByTestId('native-map')).toBeVisible({ timeout: 12_000 })
      await page.waitForTimeout(1600)
      await shot(page, dirs, '24-map')

      await page.goto('/journal?nativePreview=1')
      await expect(page.getByTestId('native-saved')).toBeVisible({ timeout: 12_000 })
      await shot(page, dirs, '25-saved')

      await page.goto('/settings?nativePreview=1')
      await expect(page.getByTestId('native-settings')).toBeVisible({ timeout: 12_000 })
      await shot(page, dirs, '26-settings')
      await page.getByTestId('native-settings-coverage').click()
      await expect(page.getByTestId('native-coverage-preview')).toBeVisible({ timeout: 8_000 })
      await shot(page, dirs, '27-unlock-preview')
      await page.getByTestId('native-unlock-dismiss').click().catch(() => {})

      await applyFixture(page, 'inRomeFreeGuest')
      await page.goto('/plan?nativePreview=1')
      await page.getByTestId('plan-start').click()
      await expect(page.getByTestId('active-route-controls')).toBeVisible({ timeout: 12_000 })
      await page.getByTestId('active-route-controls').click()
      await shot(page, dirs, '28-route-controls')
    })
  }
})
