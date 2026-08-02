import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useSyncedAudioControls } from '../useSyncedAudioControls.js'

const familyState = {
  session: null,
  syncEnabled: false,
  isWalkingIndependently: false,
  isLeader: true,
  canResumeForAll: true,
  resumePolicy: 'leader',
  markApplyingRemote: vi.fn(),
  isApplyingRemote: vi.fn(() => false),
  publishPause: vi.fn(async () => {}),
  publishResume: vi.fn(async () => {}),
  publishSeek: vi.fn(async () => {}),
  publishClock: vi.fn(async () => {}),
}

vi.mock('../../redesign/context/FamilyWalkContext.jsx', () => ({
  useOptionalFamilyWalk: () => familyState,
}))

function makeAudio(overrides = {}) {
  const elementPlaying = { current: false }
  return {
    narrationPlaying: false,
    playbackRate: 1,
    progress: { currentTime: 0, chapterIndex: 0, duration: 30, itemCount: 1 },
    pauseNarration: vi.fn(() => {
      elementPlaying.current = false
    }),
    resumeNarration: vi.fn(async () => {
      elementPlaying.current = true
      return true
    }),
    seekNarration: vi.fn(),
    jumpToChapter: vi.fn(),
    setPlaybackRate: vi.fn(),
    getEngine: () => ({
      isNarrationElementPlaying: () => elementPlaying.current,
    }),
    ...overrides,
    _elementPlaying: elementPlaying,
  }
}

describe('useSyncedAudioControls', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    familyState.session = null
    familyState.syncEnabled = false
    familyState.isWalkingIndependently = false
    familyState.isLeader = true
    familyState.canResumeForAll = true
    familyState.markApplyingRemote.mockReset()
    familyState.isApplyingRemote.mockReset()
    familyState.isApplyingRemote.mockReturnValue(false)
    familyState.publishPause.mockReset()
    familyState.publishResume.mockReset()
    familyState.publishSeek.mockReset()
    familyState.publishClock.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('pauses when UI shows playing', async () => {
    const audio = makeAudio({ narrationPlaying: true })
    audio._elementPlaying.current = true
    const { result } = renderHook(() => useSyncedAudioControls(audio))

    await act(async () => {
      await result.current.toggleSyncedPlayback()
    })

    expect(audio.pauseNarration).toHaveBeenCalledTimes(1)
  })

  it('pauses from element truth even when applying-remote guard is stuck', async () => {
    familyState.session = {
      updatedAt: 1,
      paused: false,
      playing: true,
      positionSeconds: 5,
      chapterIndex: 0,
      waypointId: 'w01',
      mySeatId: 'seat-a',
    }
    familyState.syncEnabled = true
    familyState.isApplyingRemote.mockReturnValue(true)

    const audio = makeAudio({ narrationPlaying: false })
    audio._elementPlaying.current = true
    const { result } = renderHook(() => useSyncedAudioControls(audio))

    await act(async () => {
      await result.current.toggleSyncedPlayback()
    })

    expect(audio.pauseNarration).toHaveBeenCalledTimes(1)
  })

  it('clears applying-remote after a cancelled remote apply so pause is not stuck', async () => {
    familyState.session = {
      updatedAt: 10,
      paused: false,
      playing: true,
      positionSeconds: 3,
      chapterIndex: 0,
      waypointId: 'w01',
      mySeatId: 'seat-a',
    }
    familyState.syncEnabled = true

    let applying = false
    familyState.markApplyingRemote.mockImplementation((active) => {
      applying = Boolean(active)
    })
    familyState.isApplyingRemote.mockImplementation(() => applying)

    const audio = makeAudio({ narrationPlaying: true })
    audio._elementPlaying.current = true

    const { result, rerender } = renderHook(
      ({ audio: next }) => useSyncedAudioControls(next),
      { initialProps: { audio } },
    )

    // Progress tick → new audio object, same session key cancels prior apply.
    const nextAudio = makeAudio({
      narrationPlaying: true,
      progress: { currentTime: 3.2, chapterIndex: 0, duration: 30, itemCount: 1 },
    })
    nextAudio._elementPlaying.current = true
    rerender({ audio: nextAudio })

    await act(async () => {
      vi.advanceTimersByTime(100)
    })

    expect(applying).toBe(false)

    await act(async () => {
      await result.current.toggleSyncedPlayback()
    })
    expect(nextAudio.pauseNarration).toHaveBeenCalled()
  })
})
