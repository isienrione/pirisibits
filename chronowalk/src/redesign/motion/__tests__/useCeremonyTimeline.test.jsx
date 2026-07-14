import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useCeremonyTimeline } from '../useCeremonyTimeline.js'

vi.mock('../../../hooks/useReducedMotion.js', () => ({
  useReducedMotion: () => false,
}))

const TIMELINE = Object.freeze({ pause: 0, title: 200, cta: 400 })

describe('useCeremonyTimeline', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('fires named beats in order', () => {
    const { result } = renderHook(() => useCeremonyTimeline(TIMELINE))

    expect(result.current.beats.pause).toBe(false)

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current.beats.pause).toBe(true)
    expect(result.current.beats.title).toBe(false)

    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current.beats.title).toBe(true)
    expect(result.current.beats.cta).toBe(false)

    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current.beats.cta).toBe(true)
  })
})
