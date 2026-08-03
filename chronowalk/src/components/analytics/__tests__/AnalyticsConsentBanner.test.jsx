import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const trackApi = vi.hoisted(() => ({
  getAnalyticsConsent: vi.fn(() => null),
  setAnalyticsConsent: vi.fn(),
  subscribeAnalyticsConsent: vi.fn(() => () => {}),
}))

vi.mock('../../../lib/track.js', () => trackApi)

import AnalyticsConsentBanner from '../AnalyticsConsentBanner.jsx'
import AnalyticsPreferencesControl from '../AnalyticsPreferencesControl.jsx'

describe('AnalyticsConsentBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    trackApi.getAnalyticsConsent.mockReturnValue(null)
    trackApi.subscribeAnalyticsConsent.mockReturnValue(() => {})
  })

  afterEach(() => {
    cleanup()
  })

  it('shows the marketing cookie notice when preference is unknown', () => {
    render(
      <MemoryRouter>
        <AnalyticsConsentBanner />
      </MemoryRouter>,
    )
    expect(screen.getByTestId('analytics-consent-banner')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: /marketing cookies/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /privacy policy/i })).toHaveAttribute(
      'href',
      '/legal/privacy',
    )
    expect(screen.getByTestId('analytics-consent-accept')).toHaveTextContent(/allow marketing/i)
    expect(screen.getByTestId('analytics-consent-decline')).toBeInTheDocument()
  })

  it('calls setAnalyticsConsent(true) on accept', () => {
    render(
      <MemoryRouter>
        <AnalyticsConsentBanner />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByTestId('analytics-consent-accept'))
    expect(trackApi.setAnalyticsConsent).toHaveBeenCalledWith(true)
  })

  it('calls setAnalyticsConsent(false) on decline', () => {
    render(
      <MemoryRouter>
        <AnalyticsConsentBanner />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByTestId('analytics-consent-decline'))
    expect(trackApi.setAnalyticsConsent).toHaveBeenCalledWith(false)
  })

  it('does not show again when accepted', () => {
    trackApi.getAnalyticsConsent.mockReturnValue('accepted')
    render(
      <MemoryRouter>
        <AnalyticsConsentBanner />
      </MemoryRouter>,
    )
    expect(screen.queryByTestId('analytics-consent-banner')).not.toBeInTheDocument()
  })

  it('does not show again when declined', () => {
    trackApi.getAnalyticsConsent.mockReturnValue('declined')
    render(
      <MemoryRouter>
        <AnalyticsConsentBanner />
      </MemoryRouter>,
    )
    expect(screen.queryByTestId('analytics-consent-banner')).not.toBeInTheDocument()
  })
})

describe('AnalyticsPreferencesControl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    trackApi.getAnalyticsConsent.mockReturnValue('declined')
    trackApi.subscribeAnalyticsConsent.mockReturnValue(() => {})
  })

  afterEach(() => {
    cleanup()
  })

  it('opens preferences and lets a declined user allow marketing', () => {
    render(
      <MemoryRouter>
        <AnalyticsPreferencesControl variant="footer" />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByTestId('analytics-preferences-open'))
    expect(screen.getByTestId('analytics-preferences-dialog')).toBeInTheDocument()
    expect(screen.getByText(/current choice:/i)).toHaveTextContent(/marketing cookies off/i)
    fireEvent.click(screen.getByTestId('analytics-preferences-accept'))
    expect(trackApi.setAnalyticsConsent).toHaveBeenCalledWith(true)
  })

  it('lets an accepted user turn marketing off', () => {
    trackApi.getAnalyticsConsent.mockReturnValue('accepted')
    render(
      <MemoryRouter>
        <AnalyticsPreferencesControl variant="settings" />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: /marketing preferences/i }))
    fireEvent.click(screen.getByTestId('analytics-preferences-decline'))
    expect(trackApi.setAnalyticsConsent).toHaveBeenCalledWith(false)
  })
})
