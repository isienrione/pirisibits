import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import LandingThresholdSection from '../LandingThresholdSection.jsx'

const trackMock = vi.fn()

vi.mock('../../hooks/useReducedMotion.js', () => ({
  useReducedMotion: () => false,
}))

vi.mock('../../lib/track.js', () => ({
  track: (...args) => trackMock(...args),
  TRACK_EVENTS: {
    THRESHOLD_DEMO: 'threshold_demo',
    THRESHOLD_HOLD: 'threshold_hold',
  },
}))

describe('LandingThresholdSection', () => {
  beforeEach(() => {
    trackMock.mockClear()
    vi.stubGlobal(
      'requestAnimationFrame',
      (cb) => {
        cb(performance.now() + 1000)
        return 1
      },
    )
    vi.stubGlobal('cancelAnimationFrame', () => {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders signature copy and scholarly disclaimer', () => {
    render(<LandingThresholdSection />)
    expect(screen.getByRole('heading', { level: 2, name: /press and hold/i })).toBeInTheDocument()
    expect(screen.getByText(/where historians disagree/i)).toBeInTheDocument()
    expect(screen.getByText(/do not fake certainty/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reveal the past/i })).toBeInTheDocument()
  })

  it('tracks start when reveal fallback is used', () => {
    render(<LandingThresholdSection />)
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /reveal the past/i }))
    })
    expect(trackMock).toHaveBeenCalledWith(
      'threshold_demo',
      expect.objectContaining({ action: 'start', source: 'landing' }),
    )
  })
})
