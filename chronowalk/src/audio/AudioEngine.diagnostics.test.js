import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const trackAudioPlayAttempt = vi.fn()
const trackAudioPlayBlocked = vi.fn()
const trackAudioInterrupted = vi.fn()
const trackAudioBackgroundDrop = vi.fn()
const trackAudioCompleted = vi.fn()
const acquireScreenWakeLock = vi.fn(async () => true)
const releaseScreenWakeLock = vi.fn(async () => {})

vi.mock('../lib/analytics.ts', () => ({
  trackAudioPlayAttempt: (...args) => trackAudioPlayAttempt(...args),
  trackAudioPlayBlocked: (...args) => trackAudioPlayBlocked(...args),
  trackAudioInterrupted: (...args) => trackAudioInterrupted(...args),
  trackAudioBackgroundDrop: (...args) => trackAudioBackgroundDrop(...args),
  trackAudioCompleted: (...args) => trackAudioCompleted(...args),
}))

vi.mock('./screenWakeLock.js', () => ({
  acquireScreenWakeLock: (...args) => acquireScreenWakeLock(...args),
  releaseScreenWakeLock: (...args) => releaseScreenWakeLock(...args),
}))

vi.mock('../utils/appPreferences.js', () => ({
  readBackgroundPlay: () => true,
}))

import { loadRomeManifest } from '../content/manifest.js'
import { AudioEngine } from './AudioEngine.js'

function createMockContext() {
  const gainNode = () => {
    const gain = {
      value: 0,
      setValueAtTime: vi.fn(function setValueAtTime(v) {
        this.value = v
      }),
      cancelScheduledValues: vi.fn(),
      linearRampToValueAtTime: vi.fn(function linearRampToValueAtTime(v) {
        this.value = v
      }),
    }
    return { gain, connect: vi.fn() }
  }
  return {
    state: 'running',
    currentTime: 0,
    destination: {},
    createGain: vi.fn(gainNode),
    createBufferSource: vi.fn(() => ({
      buffer: null,
      loop: false,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null,
      playbackRate: { value: 1 },
    })),
    resume: vi.fn(async () => {}),
    close: vi.fn(async () => {}),
  }
}

function createMockAudio({ playImpl } = {}) {
  const listeners = new Map()
  const audio = {
    src: '',
    currentTime: 0,
    duration: 20,
    paused: true,
    playbackRate: 1,
    preload: 'auto',
    playsInline: false,
    ended: false,
    play:
      playImpl ||
      vi.fn(async function play() {
        this.paused = false
        for (const fn of listeners.get('play') || []) fn()
      }),
    pause: vi.fn(function pause() {
      this.paused = true
      for (const fn of listeners.get('pause') || []) fn()
    }),
    load: vi.fn(),
    removeAttribute: vi.fn(),
    addEventListener: vi.fn((event, fn) => {
      const list = listeners.get(event) || []
      list.push(fn)
      listeners.set(event, list)
    }),
    removeEventListener: vi.fn((event, fn) => {
      const list = listeners.get(event) || []
      listeners.set(
        event,
        list.filter((item) => item !== fn),
      )
    }),
    dispatch(event, extra = {}) {
      const ev = { type: event, ...extra }
      for (const fn of listeners.get(event) || []) fn(ev)
    },
  }
  return audio
}

describe('AudioEngine playback diagnostics', () => {
  let engine
  let audio

  beforeEach(async () => {
    vi.clearAllMocks()
    audio = createMockAudio()
    engine = new AudioEngine({
      manifest: loadRomeManifest(),
      createContext: () => createMockContext(),
      loadBuffer: vi.fn(async () => null),
      createAudio: () => audio,
    })
    await engine.init()
  })

  afterEach(() => {
    engine.teardown()
  })

  it('fires audio_play_attempt and acquires wake lock on play', async () => {
    await engine.playWaypoint('w01')
    expect(trackAudioPlayAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        stopId: 'w01',
        routeSlug: expect.any(String),
      }),
    )
    expect(acquireScreenWakeLock).toHaveBeenCalled()
  })

  it('fires audio_play_blocked when play() rejects', async () => {
    audio.play = vi.fn(async () => {
      const err = new Error('blocked')
      err.name = 'NotAllowedError'
      throw err
    })
    await engine.playWaypoint('w01')
    expect(trackAudioPlayBlocked).toHaveBeenCalledWith({
      stopId: 'w01',
      errorName: 'NotAllowedError',
    })
  })

  it('fires audio_interrupted for stalled/waiting/error/suspend once each', async () => {
    await engine.playWaypoint('w01')
    audio.currentTime = 4.5
    audio.dispatch('stalled')
    audio.dispatch('stalled')
    audio.dispatch('waiting')
    audio.dispatch('error')
    audio.dispatch('suspend')
    expect(trackAudioInterrupted).toHaveBeenCalledTimes(4)
    expect(trackAudioInterrupted).toHaveBeenCalledWith({
      stopId: 'w01',
      eventType: 'stalled',
      currentTimeS: 4.5,
    })
  })

  it('fires audio_background_drop when time does not advance while hidden', async () => {
    await engine.playWaypoint('w01')
    audio.currentTime = 5
    engine.narrationPlaying = true

    engine.onPageHidden()
    expect(engine.backgroundProbe).toBeTruthy()

    audio.paused = true
    engine.narrationPlaying = false
    audio.currentTime = 5.1
    engine.backgroundProbe.hiddenAtMs = Date.now() - 5000

    await engine.onPageVisible()

    expect(trackAudioBackgroundDrop).toHaveBeenCalledWith(
      expect.objectContaining({
        stopId: 'w01',
        actualTimeS: 5.1,
        gapS: expect.any(Number),
      }),
    )
    expect(trackAudioBackgroundDrop.mock.calls[0][0].gapS).toBeGreaterThanOrEqual(1)
  })

  it('fires audio_completed on natural end of last plan item', async () => {
    await engine.playWaypoint('w01')
    // Jump to final plan item so `ended` completes the session.
    engine.session.index = engine.session.plan.length - 1
    audio.currentTime = 19.5
    audio.duration = 20
    audio.dispatch('ended')
    expect(trackAudioCompleted).toHaveBeenCalledWith({
      stopId: 'w01',
      durationListenedS: 19.5,
      pctComplete: expect.any(Number),
    })
    expect(trackAudioCompleted.mock.calls[0][0].pctComplete).toBeGreaterThanOrEqual(95)
  })

  it('releases wake lock when narration stops', async () => {
    await engine.playWaypoint('w01')
    releaseScreenWakeLock.mockClear()
    engine.pauseNarration()
    expect(releaseScreenWakeLock).toHaveBeenCalled()
  })
})
