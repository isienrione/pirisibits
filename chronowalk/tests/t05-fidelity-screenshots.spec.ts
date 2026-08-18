/**
 * Physical-like native fidelity screenshots at iPhone viewports.
 * Uses DEV nativePreview so the browser renders native routes.
 */
import { test } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const VIEWPORTS = [
  { name: '390x844', width: 390, height: 844 },
  { name: '393x852', width: 393, height: 852 },
  { name: '430x932', width: 430, height: 932 },
]

function guestBlob() {
  return {
    version: 2,
    id: 'cw_guest_fidelity_qa',
    createdAt: '2026-08-18T00:00:00.000Z',
    onboardingCompleted: true,
    onboardingCompletedAt: '2026-08-18T00:00:00.000Z',
    onboardingFlowVersion: 3,
    contextSchemaVersion: 2,
    context: {
      version: 2,
      traveler: {
        positiveInterestIds: ['architecture-design', 'art'],
        surpriseMe: false,
        avoidInterestIds: [],
        avoidSubInterestIds: [],
        explorationStyle: 'mix',
        iconicVsHidden: 'hidden',
        depthVsBreadth: 'mix',
        crowdTolerance: null,
        indoorOutdoor: null,
        urbanComfort: 'lively',
        eveningComfort: null,
        walkingTolerance: 'moderate',
        transportModes: ['walk'],
      },
      trip: {
        cityId: 'rome',
        residency: 'visitor',
        tripHorizon: 'today',
        dates: null,
        accommodationArea: null,
        anchors: [],
      },
      session: {
        location: { lat: 41.89885, lng: 12.47687, accuracy: 12, timestamp: Date.now() },
        locationStatus: 'granted',
        availableTimeNow: '1h',
        timeOfDay: 'morning',
        desiredEndTime: null,
        desiredEndArea: null,
        mealIntent: null,
        transportPreferenceNow: null,
      },
      history: {
        completedExperienceIds: [],
        savedExperienceIds: ['w17'],
        dismissedExperienceIds: [],
        likedExperienceIds: [],
        events: [],
      },
      interestIds: ['architecture-design', 'art'],
      surpriseMe: false,
      timeBudgetId: '1h',
      locationStatus: 'granted',
      lastPosition: { lat: 41.89885, lng: 12.47687, accuracy: 12, timestamp: Date.now() },
      completedAt: '2026-08-18T00:00:00.000Z',
    },
  }
}

test.describe('T05.2 native fidelity screenshots', () => {
  test.describe.configure({ mode: 'serial' })

  for (const vp of VIEWPORTS) {
    test(`capture ${vp.name}`, async ({ page }) => {
      const dirs = [
        resolve('/opt/cursor/artifacts/screenshots', `t05-fidelity-${vp.name}`),
        resolve(process.cwd(), 'artifacts/t05-fidelity', vp.name),
      ]
      for (const dir of dirs) mkdirSync(dir, { recursive: true })

      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.addInitScript((guest) => {
        localStorage.setItem('cw_dev_native_preview', '1')
        localStorage.setItem('cw_guest_v1', JSON.stringify(guest))
      }, guestBlob())

      const shot = async (name) => {
        await page.waitForTimeout(350)
        for (const dir of dirs) {
          await page.screenshot({ path: resolve(dir, `${name}.png`), fullPage: true })
        }
      }

      await page.goto('/welcome?nativePreview=1')
      await page.evaluate(() => localStorage.removeItem('cw_guest_v1'))
      await page.reload()
      await shot('01-welcome')

      await page.goto('/context?nativePreview=1')
      await shot('02-context-interests')

      await page.evaluate((guest) => {
        localStorage.setItem('cw_dev_native_preview', '1')
        localStorage.setItem('cw_guest_v1', JSON.stringify(guest))
      }, guestBlob())

      await page.goto('/plan?nativePreview=1')
      await shot('03-plan')

      await page.goto('/home?nativePreview=1')
      await shot('04-discover-home')

      await page.goto('/route/adjust?nativePreview=1')
      await shot('05-adjust')

      await page.goto('/plan?nativePreview=1')
      const start = page.getByTestId('plan-start')
      if (await start.count()) await start.click()
      await shot('06-active-route')

      await page.goto('/discovery/d_rome_22?nativePreview=1')
      await shot('07-discovery-detail')

      await page.goto('/next?nativePreview=1')
      await shot('08-bifurcation')
      await shot('10-best-next')

      await page.goto('/mystery?nativePreview=1')
      await shot('09-mystery')

      await page.goto('/map?nativePreview=1')
      await page.waitForTimeout(800)
      await shot('11-map')

      await page.goto('/journal?nativePreview=1')
      await shot('12-saved')

      await page.goto('/route?nativePreview=1')
      const controls = page.getByTestId('active-route-controls')
      if (await controls.count()) await controls.click()
      await shot('13-route-controls')
    })
  }
})
