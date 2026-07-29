import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import LandingIntroNav from '../LandingIntroNav.jsx'

describe('LandingIntroNav', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('advances from compress to nav without getting stuck when phase changes', () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()
    render(<LandingIntroNav onComplete={onComplete} />)

    expect(document.querySelector('.cw-v4-intro')).toBeTruthy()

    // Fallback beginCompress (7s) then compress→nav (450ms).
    act(() => {
      vi.advanceTimersByTime(7000)
    })
    expect(document.querySelector('.cw-v4-intro--compress')).toBeTruthy()

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(document.querySelector('[data-phase="nav"]')).toBeTruthy()
    expect(onComplete).toHaveBeenCalled()
    expect(screen.getByLabelText('ChronoWalk home')).toBeTruthy()
  })

  it('skips the intro after the play cap', () => {
    localStorage.setItem('cw_landing_intro_plays_v1', '2')
    const onComplete = vi.fn()
    render(<LandingIntroNav onComplete={onComplete} />)
    expect(document.querySelector('.cw-v4-intro')).toBeNull()
    expect(document.querySelector('[data-phase="nav"]')).toBeTruthy()
    expect(onComplete).toHaveBeenCalled()
  })
})
