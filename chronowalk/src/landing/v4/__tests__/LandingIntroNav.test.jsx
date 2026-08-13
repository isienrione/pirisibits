import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import LandingIntroNav, { LANDING_INTRO_VIDEO_ENABLED } from '../LandingIntroNav.jsx'

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
    vi.unstubAllGlobals()
  })

  it('keeps the cinematic intro disabled site-wide', () => {
    expect(LANDING_INTRO_VIDEO_ENABLED).toBe(false)
  })

  it('never mounts the intro video overlay', () => {
    const onComplete = vi.fn()
    render(<LandingIntroNav onComplete={onComplete} />)

    expect(document.querySelector('.cw-v4-intro')).toBeNull()
    expect(document.querySelector('video.cw-v4-intro__video')).toBeNull()
    expect(document.querySelector('[data-phase="nav"]')).toBeTruthy()
    expect(onComplete).toHaveBeenCalled()
    expect(screen.getByLabelText('ChronoWalk home')).toBeTruthy()
  })

  it('shows a bilingual audio notice next to the language switcher', () => {
    render(<LandingIntroNav onComplete={vi.fn()} />)

    expect(document.querySelector('.cw-v4-nav__language-sign')).toBeTruthy()
    expect(document.querySelector('[data-testid="landing-language-control"]')).toBeTruthy()
    expect(
      screen.getByText(/Audio in English & Spanish — choose your language/i),
    ).toBeTruthy()
    expect(screen.getByRole('group', { name: /choose language/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /english/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /español/i })).toBeTruthy()
  })

  it('still skips any intro after a prior play flag', () => {
    localStorage.setItem('cw_landing_intro_plays_v1', '1')
    const onComplete = vi.fn()
    render(<LandingIntroNav onComplete={onComplete} />)
    expect(document.querySelector('.cw-v4-intro')).toBeNull()
    expect(document.querySelector('[data-phase="nav"]')).toBeTruthy()
    expect(onComplete).toHaveBeenCalled()
  })
})
