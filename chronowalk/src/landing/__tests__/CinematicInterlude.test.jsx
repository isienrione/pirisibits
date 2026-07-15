import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import CinematicInterlude from '../CinematicInterlude.jsx'
import '../CinematicInterlude.css'

vi.mock('../../hooks/useReducedMotion.js', () => ({
  useReducedMotion: () => true,
}))

describe('CinematicInterlude', () => {
  beforeEach(() => {
    class MockIO {
      observe() {}
      disconnect() {}
      unobserve() {}
    }
    vi.stubGlobal('IntersectionObserver', MockIO)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the verse lines without CTA chrome', () => {
    render(
      <CinematicInterlude
        id="interlude"
        lines={['Rome is loud.', "History isn't.", "That's why the story waits until you arrive."]}
        image={{
          mobileSrc: '/landing/interlude-mobile.jpg',
          desktopSrc: '/landing/interlude-desktop.jpg',
          mobileWidth: 960,
          mobileHeight: 1200,
          desktopWidth: 1600,
          desktopHeight: 900,
        }}
        parallax={false}
      />,
    )

    expect(screen.getByRole('heading', { level: 2, name: /rome is loud/i })).toBeInTheDocument()
    expect(screen.getByText(/history isn't/i)).toBeInTheDocument()
    expect(screen.getByText(/story waits until you arrive/i)).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('lazy-loads a responsive picture', () => {
    const { container } = render(
      <CinematicInterlude
        id="interlude"
        lines={['Rome is loud.']}
        image={{
          mobileSrc: '/landing/interlude-mobile.jpg',
          desktopSrc: '/landing/interlude-desktop.jpg',
        }}
        parallax={false}
      />,
    )

    const img = container.querySelector('img.cw-cinematic-interlude__img')
    expect(img).toBeTruthy()
    expect(img.getAttribute('loading')).toBe('lazy')
    expect(container.querySelectorAll('source')).toHaveLength(2)
  })
})
