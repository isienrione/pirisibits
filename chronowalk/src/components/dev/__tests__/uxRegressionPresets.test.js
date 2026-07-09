import { beforeEach, describe, expect, it } from 'vitest'
import { loadRomeManifest } from '../../../content/manifest.js'
import { ACCESS_KEY } from '../../../lib/config.js'
import { OFFLINE_AUDIO_STATUS, ROME_OFFLINE_STATUS_KEY, readRomeOfflineStatus } from '../../../audio/offlinePackage.js'
import { getJourneySnapshot, JOURNEY_STATES, resetJourney } from '../../../state/journey.js'
import {
  applyFirstTimeVisitorPreset,
  applyJourneyScenePreset,
  applyPurchasedFirstTimePreset,
  applyReturningWithProgressPreset,
  applyUxPersonaPreset,
  mergeSearchParams,
  UX_JOURNEY_SCENE_IDS,
  UX_PERSONA_IDS,
} from '../uxRegressionPresets.js'

const JOURNEY_KEY = 'cw_journey_v1'

describe('uxRegressionPresets', () => {
  beforeEach(() => {
    localStorage.clear()
    resetJourney()
  })

  it('mergeSearchParams adds and replaces query keys', () => {
    expect(mergeSearchParams('?foo=1', { bar: '2' })).toBe('?foo=1&bar=2')
    expect(mergeSearchParams('?foo=1', { foo: '9', baz: null })).toBe('?foo=9')
  })

  it('first-time visitor clears access and journey', () => {
    localStorage.setItem(ACCESS_KEY, 'true')
    localStorage.setItem(JOURNEY_KEY, JSON.stringify({ state: 'walking', context: {} }))

    const result = applyFirstTimeVisitorPreset()

    expect(result.route).toBe('/landing')
    expect(localStorage.getItem(ACCESS_KEY)).toBeNull()
    expect(getJourneySnapshot().state).toBe(JOURNEY_STATES.IDLE)
    expect(readRomeOfflineStatus().status).toBe(OFFLINE_AUDIO_STATUS.NONE)
  })

  it('purchased first-time grants access and resets journey', () => {
    const result = applyPurchasedFirstTimePreset()

    expect(result.route).toBe('/setup')
    expect(localStorage.getItem(ACCESS_KEY)).toBe('true')
    expect(getJourneySnapshot().state).toBe(JOURNEY_STATES.IDLE)
  })

  it('returning with progress creates resumable journey', () => {
    const manifest = loadRomeManifest()
    const result = applyReturningWithProgressPreset(manifest)

    expect(result.route).toBe('/begin')
    expect(localStorage.getItem(ACCESS_KEY)).toBe('true')
    expect(getJourneySnapshot().state).toBe(JOURNEY_STATES.WALKING)
    expect(getJourneySnapshot().context.completedWaypointIds).toContain('w01')
  })

  it('applyUxPersonaPreset routes first-time visitor', () => {
    expect(applyUxPersonaPreset(null, UX_PERSONA_IDS.FIRST_TIME_VISITOR).route).toBe('/landing')
  })

  it('threshold scene forces threshold state at colosseum', () => {
    const manifest = loadRomeManifest()
    const result = applyJourneyScenePreset(manifest, UX_JOURNEY_SCENE_IDS.THRESHOLD)

    expect(result.route).toBe('/journey')
    expect(getJourneySnapshot().state).toBe(JOURNEY_STATES.THRESHOLD)
  })

  it('offline scene marks package complete', () => {
    const manifest = loadRomeManifest()
    applyJourneyScenePreset(manifest, UX_JOURNEY_SCENE_IDS.OFFLINE)

    expect(readRomeOfflineStatus().status).toBe(OFFLINE_AUDIO_STATUS.COMPLETE)
    expect(localStorage.getItem(ROME_OFFLINE_STATUS_KEY)).toBeTruthy()
  })

  it('full complete scene lands on letter route', () => {
    const manifest = loadRomeManifest()
    const result = applyJourneyScenePreset(manifest, UX_JOURNEY_SCENE_IDS.FULL_COMPLETE)

    expect(result.route).toBe('/letter')
    expect(getJourneySnapshot().state).toBe(JOURNEY_STATES.COMPLETE)
  })
})
