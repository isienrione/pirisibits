import { describe, expect, it, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { BeginPage } from '../BeginPage'
import { ACCESS_KEY } from '../../../lib/config'
import { JOURNEY_STATES, resetJourney, transitionJourney } from '../../../state/journey'
import { clearTourEntitlements, purchaseTourProduct } from '../../../services/tourEntitlements'

function renderBeginPage() {
  return render(
    <MemoryRouter initialEntries={['/begin']}>
      <Routes>
        <Route path="/begin" element={<BeginPage />} />
        <Route path="/landing" element={<div>Landing route</div>} />
        <Route path="/journey" element={<div>Journey route</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('BeginPage', () => {
  beforeEach(() => {
    localStorage.clear()
    clearTourEntitlements()
    resetJourney()
    transitionJourney(JOURNEY_STATES.IDLE)
  })

  it('redirects visitors without access to landing', () => {
    renderBeginPage()

    expect(screen.getByText('Landing route')).toBeInTheDocument()
  })

  it('starts at post-purchase tour review for first-time purchasers', () => {
    localStorage.setItem(ACCESS_KEY, 'true')
    purchaseTourProduct('rome-complete')

    renderBeginPage()

    expect(screen.getByText(/review & begin/i)).toBeInTheDocument()
    expect(screen.getByTestId('purchased-package-summary')).toHaveTextContent(/roma eterna/i)
    expect(screen.queryByText(/€|\$\d/)).not.toBeInTheDocument()
    expect(screen.queryByTestId('tour-route-preview')).not.toBeInTheDocument()
  })

  it('shows pace-aware route preview after choosing the full purchased route', () => {
    localStorage.setItem(ACCESS_KEY, 'true')
    purchaseTourProduct('rome-complete')

    renderBeginPage()

    fireEvent.click(screen.getByRole('button', { name: /continue — full route/i }))

    expect(screen.getByTestId('tour-route-preview')).toBeInTheDocument()
    expect(screen.getByText(/your route/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enable location & begin/i })).toBeInTheDocument()
  })

  it('scopes begin options to the purchased package without pricing', () => {
    localStorage.setItem(ACCESS_KEY, 'true')
    purchaseTourProduct('rome-essential')

    renderBeginPage()

    expect(screen.getByTestId('purchased-package-summary')).toHaveTextContent(/roma antica/i)
    expect(screen.getByRole('button', { name: /at your own pace/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue — full route/i })).toBeInTheDocument()
    expect(screen.queryByText(/roma historica/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/\$17|€17|\$12|€12|\$9|€9/)).not.toBeInTheDocument()
  })

  it('skips route preview when onboarding was already completed', () => {
    localStorage.setItem(ACCESS_KEY, 'true')
    localStorage.setItem('cw_tour_onboarding_complete', 'true')
    purchaseTourProduct('rome-essential')

    renderBeginPage()

    fireEvent.click(screen.getByRole('button', { name: /continue — full route/i }))

    expect(screen.queryByTestId('tour-route-preview')).not.toBeInTheDocument()
    expect(screen.getByText(/enable location for gps guidance/i)).toBeInTheDocument()
  })

  it('shows resume prompt for purchasers with an in-progress journey', () => {
    localStorage.setItem(ACCESS_KEY, 'true')
    purchaseTourProduct('rome-complete')
    transitionJourney(JOURNEY_STATES.WALKING, {
      currentSequenceIndex: 2,
      completedWaypointIds: ['w01'],
    })

    renderBeginPage()

    expect(screen.getByRole('heading', { name: /rome kept your place/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue your walk/i })).toBeInTheDocument()
  })
})
