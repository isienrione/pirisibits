import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LandingSiteFooter from '../LandingSiteFooter.jsx'

vi.mock('../../lib/track.js', () => ({
  getAnalyticsConsent: () => 'declined',
  setAnalyticsConsent: vi.fn(),
  subscribeAnalyticsConsent: () => () => {},
}))

describe('LandingSiteFooter privacy choices', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
  })

  it('exposes Privacy choices from the footer', () => {
    render(
      <MemoryRouter>
        <LandingSiteFooter />
      </MemoryRouter>,
    )
    expect(screen.getByTestId('analytics-preferences')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('analytics-preferences-open'))
    expect(screen.getByTestId('analytics-preferences-dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /privacy choices/i })).toBeInTheDocument()
  })
})
