import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useStoryAudio } from '../useStoryAudio'

describe('useStoryAudio', () => {
  beforeEach(() => {
    vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  })

  it('reports zero progress before metadata loads', () => {
    const { result } = renderHook(() =>
      useStoryAudio({ src: '/waypoints/colosseum/Audio_sample.mp3', initialProgress: 0 })
    )

    expect(result.current.progress).toBe(0)
    expect(result.current.isPlaying).toBe(false)
  })

  it('exposes playback controls', () => {
    const { result } = renderHook(() =>
      useStoryAudio({ src: '/test.mp3', initialProgress: 0 })
    )

    expect(typeof result.current.toggle).toBe('function')
    expect(typeof result.current.seekBy).toBe('function')
    expect(typeof result.current.seekToProgress).toBe('function')
  })
})
