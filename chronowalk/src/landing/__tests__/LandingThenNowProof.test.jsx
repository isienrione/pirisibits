import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import LandingThenNowProof from '../v4/LandingThenNowProof.jsx'
import { LANDING_CONTENT } from '../landingData.js'

const viewedMock = vi.fn()
const startedMock = vi.fn()
const completedMock = vi.fn()

vi.mock('../../hooks/useReducedMotion.js', () => ({
  useReducedMotion: () => false,
}))

vi.mock('../landingAnalytics.js', () => ({
  trackThenNowDemoViewed: (...args) => viewedMock(...args),
  trackThenNowDemoStarted: (...args) => startedMock(...args),
  trackThenNowDemoCompleted: (...args) => completedMock(...args),
}))

describe('LandingThenNowProof', () => {
  beforeEach(() => {
    viewedMock.mockClear()
    startedMock.mockClear()
    completedMock.mockClear()
    vi.stubGlobal('requestAnimationFrame', (cb) => {
      cb(performance.now() + 1000)
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', () => {})
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

  it('renders approved copy and a Show Ancient Rome fallback', () => {
    render(<LandingThenNowProof />)
    const section = LANDING_CONTENT.thenNowProof
    expect(screen.getByRole('heading', { level: 2, name: section.headline })).toBeInTheDocument()
    expect(screen.getByText(section.support)).toBeInTheDocument()
    expect(screen.getByText(section.exampleNote)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: section.revealLabel })).toBeInTheDocument()
  })

  it('tracks view once when entering viewport and start on fallback toggle', () => {
    render(<LandingThenNowProof />)
    expect(viewedMock).toHaveBeenCalledTimes(1)

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Show Ancient Rome/i }))
    })
    expect(startedMock).toHaveBeenCalledWith(expect.objectContaining({ via: 'button' }))
  })

  it('does not mount audio elements', () => {
    const { container } = render(<LandingThenNowProof />)
    expect(container.querySelector('audio')).toBeNull()
    expect(container.querySelector('video')).toBeNull()
  })
})
