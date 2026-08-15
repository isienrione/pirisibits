import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import LandingIntroNav, { LANDING_INTRO_VIDEO_ENABLED } from '../LandingIntroNav.jsx'
import { LANDING_CONTENT } from '../../landingData.js'

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
    document.body.style.overflow = ''
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

  it('shows a flagged EN/ES language switcher in the nav', () => {
    render(<LandingIntroNav onComplete={vi.fn()} />)

    expect(document.querySelector('.cw-v4-nav__language-sign')).toBeNull()
    expect(document.querySelector('[data-testid="landing-language-control"]')).toBeTruthy()
    expect(screen.getByRole('group', { name: /choose language/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /english/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /español/i })).toBeTruthy()
    expect(document.querySelectorAll('.cw-lang-switch__flag').length).toBe(2)
    expect(screen.getByText('EN')).toBeTruthy()
    expect(screen.getByText('ES')).toBeTruthy()
  })

  it('still skips any intro after a prior play flag', () => {
    localStorage.setItem('cw_landing_intro_plays_v1', '1')
    const onComplete = vi.fn()
    render(<LandingIntroNav onComplete={onComplete} />)
    expect(document.querySelector('.cw-v4-intro')).toBeNull()
    expect(document.querySelector('[data-phase="nav"]')).toBeTruthy()
    expect(onComplete).toHaveBeenCalled()
  })

  it('keeps the explore sidebar closed by default with an obvious Menu control', () => {
    render(<LandingIntroNav onComplete={vi.fn()} />)

    const toggle = screen.getByTestId('landing-explore-toggle')
    expect(toggle).toBeTruthy()
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText('Menu')).toBeTruthy()

    const sidebar = screen.getByTestId('landing-explore-sidebar')
    expect(sidebar.classList.contains('is-open')).toBe(false)
    expect(sidebar).toHaveAttribute('aria-hidden', 'true')
  })

  it('opens the explore sidebar with every landing section link', () => {
    render(<LandingIntroNav onComplete={vi.fn()} />)

    fireEvent.click(screen.getByTestId('landing-explore-toggle'))

    const sidebar = screen.getByTestId('landing-explore-sidebar')
    expect(sidebar.classList.contains('is-open')).toBe(true)
    expect(screen.getByRole('dialog', { name: /jump to/i })).toBeTruthy()
    expect(screen.getByTestId('landing-explore-toggle')).toHaveAttribute('aria-expanded', 'true')

    const expected = LANDING_CONTENT.header.exploreNav
    expect(expected.length).toBeGreaterThanOrEqual(7)
    for (const item of expected) {
      const link = sidebar.querySelector(`a[href="${item.href}"]`)
      expect(link).toBeTruthy()
      expect(link.textContent).toContain(item.label)
    }
  })

  it('uses conversion-minded labels instead of draft section names', () => {
    render(<LandingIntroNav onComplete={vi.fn()} />)
    fireEvent.click(screen.getByTestId('landing-explore-toggle'))

    const sidebar = screen.getByTestId('landing-explore-sidebar')
    expect(sidebar.querySelector('a[href="#pricing"]')?.textContent).toMatch(/choose your walk/i)
    expect(sidebar.querySelector('a[href="#faq"]')?.textContent).toMatch(/before you buy/i)
    expect(sidebar.querySelector('a[href="#get-app"]')?.textContent).toMatch(/start in your browser/i)
    expect(sidebar.querySelector('a[href="#faq"]')?.textContent).not.toMatch(/^faq$/i)
    expect(sidebar.textContent).not.toMatch(/who it’s for/i)
  })

  it('closes the explore sidebar via Escape and restores body scroll', () => {
    render(<LandingIntroNav onComplete={vi.fn()} />)

    fireEvent.click(screen.getByTestId('landing-explore-toggle'))
    expect(document.body.style.overflow).toBe('hidden')

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.getByTestId('landing-explore-sidebar').classList.contains('is-open')).toBe(false)
    expect(document.body.style.overflow).toBe('')
  })
})
