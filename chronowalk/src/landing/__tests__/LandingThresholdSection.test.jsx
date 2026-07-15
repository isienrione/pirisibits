import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import LandingThresholdSection from '../LandingThresholdSection.jsx'

const startMock = vi.fn()
const completeMock = vi.fn()
const cancelMock = vi.fn()

vi.mock('../../hooks/useReducedMotion.js', () => ({
  useReducedMotion: () => false,
}))

vi.mock('../landingAnalytics.js', () => ({
  trackLandingThresholdStart: (...args) => startMock(...args),
  trackLandingThresholdComplete: (...args) => completeMock(...args),
  trackLandingThresholdCancelled: (...args) => cancelMock(...args),
}))

describe('LandingThresholdSection', () => {
  beforeEach(() => {
    startMock.mockClear()
    completeMock.mockClear()
    cancelMock.mockClear()
    vi.stubGlobal('requestAnimationFrame', (cb) => {
      cb(performance.now() + 1000)
      return 1
    })
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
    expect(startMock).toHaveBeenCalledWith(expect.objectContaining({ via: 'button' }))
  })
})
