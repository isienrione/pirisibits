import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const posthogMock = vi.hoisted(() => ({
  capture: vi.fn(),
  register: vi.fn(),
}))

vi.mock('posthog-js', () => ({ default: posthogMock }))
vi.mock('../config.js', () => ({ getAbVariantCents: () => 1499 }))
vi.mock('../../landing/landingExperiments.js', () => ({
  peekLandingExpHero: () => 'control',
  ensureLandingExpHero: () => 'control',
}))

describe('audio diagnostic analytics helpers', () => {
  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()
    localStorage.clear()
    const { markAnalyticsReady, __resetAnalyticsSessionForTests } = await import('../analytics.ts')
    __resetAnalyticsSessionForTests()
    markAnalyticsReady(true)
  })

  it('tracks audio_play_attempt with stop, route, and device flags', async () => {
    const { trackAudioPlayAttempt } = await import('../analytics.ts')
    trackAudioPlayAttempt({ stopId: 'w01', routeSlug: 'rome' })
    expect(posthogMock.capture).toHaveBeenCalledWith(
      'audio_play_attempt',
      expect.objectContaining({
        stop_id: 'w01',
        route_slug: 'rome',
        is_pwa: expect.any(Boolean),
        is_ios: expect.any(Boolean),
      }),
    )
  })

  it('tracks play blocked, interrupted, background drop, completed, wake lock', async () => {
    const {
      trackAudioPlayBlocked,
      trackAudioInterrupted,
      trackAudioBackgroundDrop,
      trackAudioCompleted,
      trackWakeLockAcquired,
      trackWakeLockFailed,
      trackWakeLockReleasedUnexpectedly,
    } = await import('../analytics.ts')

    trackAudioPlayBlocked({ stopId: 'w02', errorName: 'NotAllowedError' })
    trackAudioInterrupted({ stopId: 'w02', eventType: 'stalled', currentTimeS: 3.2 })
    trackAudioBackgroundDrop({
      stopId: 'w02',
      expectedTimeS: 10,
      actualTimeS: 3,
      gapS: 7,
    })
    trackAudioCompleted({ stopId: 'w02', durationListenedS: 42.4, pctComplete: 99.2 })
    trackWakeLockAcquired()
    trackWakeLockFailed({ errorName: 'NotAllowedError' })
    trackWakeLockReleasedUnexpectedly()

    const names = posthogMock.capture.mock.calls.map(([e]) => e)
    expect(names).toEqual([
      'audio_play_blocked',
      'audio_interrupted',
      'audio_background_drop',
      'audio_completed',
      'wake_lock_acquired',
      'wake_lock_failed',
      'wake_lock_released_unexpectedly',
    ])
    expect(posthogMock.capture.mock.calls[0][1]).toMatchObject({
      stop_id: 'w02',
      error_name: 'NotAllowedError',
    })
    expect(posthogMock.capture.mock.calls[3][1]).toMatchObject({
      duration_listened_s: 42,
      pct_complete: 99,
    })
  })
})
