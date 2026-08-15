import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import LandingThenNowProof from '../v4/LandingThenNowProof.jsx'
import { LANDING_CONTENT } from '../landingData.js'

const viewedMock = vi.fn()
const startedMock = vi.fn()
const completedMock = vi.fn()

vi.mock('../../hooks/useReducedMotion.js', () => ({
  useReducedMotion: () => true,
}))

vi.mock('../landingAnalytics.js', () => ({
  trackThenNowDemoViewed: (...args) => viewedMock(...args),
  trackThenNowDemoStarted: (...args) => startedMock(...args),
  trackThenNowDemoCompleted: (...args) => completedMock(...args),
}))

vi.mock('../v4/usePhoneArtboardScale.js', () => ({
  default: () => ({ screenRef: { current: null }, scale: 0.5 }),
}))

describe('LandingThenNowProof', () => {
  beforeEach(() => {
    viewedMock.mockClear()
    startedMock.mockClear()
    completedMock.mockClear()
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb) {
          this.cb = cb
        }
        observe() {
          this.cb([{ isIntersecting: true }])
        }
        disconnect() {}
        unobserve() {}
      },
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders marketing copy around a phone-framed app Threshold', () => {
    render(<LandingThenNowProof />)
    const section = LANDING_CONTENT.thenNowProof
    expect(screen.getByRole('heading', { level: 2, name: section.headline })).toBeInTheDocument()
    expect(screen.getByLabelText(/ChronoWalk Then\/Now inside the app/i)).toBeInTheDocument()
    expect(screen.getByTestId('then-now-app-screen')).toBeInTheDocument()
    expect(screen.getAllByText(/Hold to reveal Ancient Rome/i).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: section.revealLabel })).toBeInTheDocument()
  })

  it('tracks view once when entering viewport', () => {
    render(<LandingThenNowProof />)
    expect(viewedMock).toHaveBeenCalledTimes(1)
  })

  it('does not mount audio elements', () => {
    const { container } = render(<LandingThenNowProof />)
    expect(container.querySelector('audio')).toBeNull()
  })

  it('uses the product Colosseum interior reconstruction media', () => {
    const { container } = render(<LandingThenNowProof />)
    const media = [
      ...[...container.querySelectorAll('img')].map((el) => el.getAttribute('src') || ''),
      ...[...container.querySelectorAll('video')].map(
        (el) => el.getAttribute('src') || el.getAttribute('poster') || '',
      ),
    ]
    expect(media.some((src) => src.includes('/waypoints/colosseum/interior/'))).toBe(true)
    expect(container.querySelector('video')).toBeTruthy()
  })

  it('renders a compact hero-slide variant when active', () => {
    render(<LandingThenNowProof variant="hero-slide" active />)
    expect(screen.getByTestId('hero-then-now-slide')).toBeInTheDocument()
    expect(screen.queryByTestId('then-now-proof')).not.toBeInTheDocument()
    expect(screen.queryByText(LANDING_CONTENT.thenNowProof.exampleNote)).not.toBeInTheDocument()
    expect(viewedMock).toHaveBeenCalledTimes(1)
  })

  it('does not treat inactive hero slides as in view', () => {
    render(<LandingThenNowProof variant="hero-slide" active={false} />)
    expect(viewedMock).not.toHaveBeenCalled()
  })
})
