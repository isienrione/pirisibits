import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { I18nProvider } from '../../../i18n/I18nProvider.jsx'
import NativeContextFlow from '../NativeContextFlow.jsx'
import NativeDiscoverHome from '../NativeDiscoverHome.jsx'
import NativePlanScreen from '../NativePlanScreen.jsx'
import NativeExperienceScreen from '../NativeExperienceScreen.jsx'
import NativeSettingsScreen from '../NativeSettingsScreen.jsx'
import NativeUnlockSheet from '../../ui/NativeUnlockSheet.jsx'
import { clearGuestSession, completeNativeContext, readGuestSession } from '../../../lib/guestSession.js'
import { clearRouteState } from '../../../lib/route/store.js'
import { clearLocalAccessState } from '../../../lib/accessSession.js'
import { resetJourney } from '../../../state/journey.js'
import * as paddle from '../../../lib/paddle.js'
import * as locationAccess from '../../../lib/locationAccess.js'

vi.spyOn(paddle, 'openPaddleCheckout')
vi.spyOn(locationAccess, 'getLocationFix').mockResolvedValue({
  status: 'denied',
  position: null,
})

function renderApp(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <I18nProvider>
        <Routes>
          <Route path="/context" element={<NativeContextFlow />} />
          <Route path="/plan" element={<NativePlanScreen />} />
          <Route path="/home" element={<NativeDiscoverHome />} />
          <Route path="/experience/:heroId" element={<NativeExperienceScreen />} />
          <Route path="/journey" element={<div data-testid="canonical-player">CANONICAL PLAYER</div>} />
          <Route path="/map" element={<div>MAP SURFACE</div>} />
          <Route path="/settings" element={<NativeSettingsScreen />} />
          <Route path="/explore" element={<div>EXPLORE</div>} />
        </Routes>
      </I18nProvider>
    </MemoryRouter>,
  )
}

describe('native Context + Discover + lock sheet', () => {
  beforeEach(() => {
    localStorage.clear()
    clearLocalAccessState()
    clearGuestSession()
    clearRouteState()
    resetJourney()
    paddle.openPaddleCheckout.mockClear()
  })

  it('saves interests and time then reaches the proposed plan', () => {
    renderApp('/context')

    fireEvent.click(screen.getByTestId('native-context-interest-architecture-design'))
    fireEvent.click(screen.getByTestId('native-context-interests-continue'))
    fireEvent.click(screen.getByTestId('native-context-refine-skip'))
    fireEvent.click(screen.getByTestId('native-context-style-exploration-mix'))
    fireEvent.click(screen.getByTestId('native-context-style-iconic-mix'))
    fireEvent.click(screen.getByTestId('native-context-style-depth-mix'))
    fireEvent.click(screen.getByTestId('native-context-style-continue'))
    fireEvent.click(screen.getByTestId('native-context-urban-lively'))
    fireEvent.click(screen.getByTestId('native-context-mobility-continue'))
    fireEvent.click(screen.getByTestId('native-context-trip-horizon-today'))
    fireEvent.click(screen.getByTestId('native-context-trip-continue'))
    fireEvent.click(screen.getByTestId('native-context-time-30min'))
    fireEvent.click(screen.getByTestId('native-context-time-continue'))
    fireEvent.click(screen.getByTestId('native-context-location-skip'))

    expect(readGuestSession()?.onboardingCompleted).toBe(true)
    expect(readGuestSession()?.context.interestIds).toEqual(['architecture-design'])
    expect(readGuestSession()?.context.timeBudgetId).toBe('30min')
    expect(readGuestSession()?.context.trip.tripHorizon).toBe('today')
    expect(readGuestSession()?.context.session.availableTimeNow).toBe('30min')
    expect(readGuestSession()?.context.traveler.walkingTolerance).toBe('moderate')
    expect(readGuestSession()?.context.traveler.urbanComfort).toBe('lively')
    expect(screen.getByTestId('native-plan')).toBeInTheDocument()
  })

  it('shows Discover with a proposed route and nearby cards, not the linear tour hub', () => {
    completeNativeContext({ interestIds: ['architecture'], timeBudgetId: '30min', surpriseMe: false })
    renderApp('/home')

    expect(screen.getByTestId('native-discover')).toBeInTheDocument()
    expect(screen.getByTestId('discover-route-card')).toBeInTheDocument()
    expect(screen.getByTestId('discover-primary-card')).toBeInTheDocument()
    expect(document.querySelectorAll('[data-testid^="discover-alt-card-"]').length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText(/0 of 21/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/roma eterna/i)).not.toBeInTheDocument()
  })

  it('opens Map from Discover', () => {
    completeNativeContext({ interestIds: ['architecture'], timeBudgetId: '30min' })
    renderApp('/home')
    fireEvent.click(screen.getByTestId('discover-map'))
    expect(screen.getByText('MAP SURFACE')).toBeInTheDocument()
  })

  it('starts free Pantheon into the canonical player', () => {
    completeNativeContext({ interestIds: ['architecture'], timeBudgetId: '30min' })
    renderApp('/experience/w17')
    fireEvent.click(screen.getByTestId('experience-start'))
    expect(screen.getByTestId('canonical-player')).toBeInTheDocument()
    expect(paddle.openPaddleCheckout).not.toHaveBeenCalled()
  })

  it('shows a placeholder unlock sheet for premium w01 without Paddle', () => {
    completeNativeContext({ interestIds: ['ancient-power'], timeBudgetId: '1h' })
    renderApp('/experience/w01')
    fireEvent.click(screen.getByTestId('experience-start'))
    expect(screen.getByTestId('native-unlock-sheet')).toBeInTheDocument()
    expect(screen.getByTestId('native-unlock-purchase')).toBeDisabled()
    expect(screen.getByTestId('native-unlock-purchase')).toHaveTextContent(/purchases coming next/i)
    expect(paddle.openPaddleCheckout).not.toHaveBeenCalled()
    expect(screen.queryByTestId('canonical-player')).not.toBeInTheDocument()
  })

  it('renders a guest Settings surface', () => {
    render(
      <MemoryRouter>
        <I18nProvider>
          <NativeSettingsScreen />
        </I18nProvider>
      </MemoryRouter>,
    )
    expect(screen.getByTestId('native-settings')).toBeInTheDocument()
    expect(screen.getByText(/settings/i)).toBeInTheDocument()
  })

  it('keeps the unlock CTA disabled', () => {
    render(
      <MemoryRouter>
        <I18nProvider>
          <NativeUnlockSheet open heroId="w01" title="The Colosseum" onClose={() => {}} />
        </I18nProvider>
      </MemoryRouter>,
    )
    expect(screen.getByTestId('native-unlock-purchase')).toBeDisabled()
    expect(screen.getByTestId('native-coverage-preview')).toBeInTheDocument()
    expect(screen.queryByText(/historica|antica|eterna|rome-essential/i)).not.toBeInTheDocument()
    expect(paddle.openPaddleCheckout).not.toHaveBeenCalled()
  })
})
