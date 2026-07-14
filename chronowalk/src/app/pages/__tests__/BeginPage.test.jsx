import { describe, expect, it, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { BeginPage } from '../BeginPage'
import { ACCESS_KEY } from '../../../lib/config'
import { JOURNEY_STATES, resetJourney, transitionJourney } from '../../../state/journey'

function renderBeginPage() {
  return render(
    <MemoryRouter initialEntries={['/begin']}>
      <Routes>
        <Route path="/begin" element={<BeginPage />} />
        <Route path="/purchase" element={<div>Purchase route</div>} />
        <Route path="/landing" element={<div>Landing route</div>} />
        <Route path="/journey" element={<div>Journey route</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('BeginPage', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    resetJourney()
    transitionJourney(JOURNEY_STATES.IDLE)
  })

  it('redirects visitors without access to purchase', () => {
    renderBeginPage()

    expect(screen.getByText('Purchase route')).toBeInTheDocument()
  })

  it('starts at pace selection for first-tour purchasers', () => {
    localStorage.setItem(ACCESS_KEY, 'true')

    renderBeginPage()

    expect(screen.getByText(/choose your/i)).toBeInTheDocument()
    expect(screen.getByText(/rome\./i)).toBeInTheDocument()
    expect(screen.queryByTestId('tour-route-preview')).not.toBeInTheDocument()
  })

  it('shows pace-aware route preview after choosing a pace', () => {
    localStorage.setItem(ACCESS_KEY, 'true')

    renderBeginPage()

    fireEvent.click(screen.getByRole('button', { name: /begin — roma eterna/i }))

    expect(screen.getByTestId('tour-route-preview')).toBeInTheDocument()
    expect(screen.getByText(/your route/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enable location & begin/i })).toBeInTheDocument()
  })

  it('skips route preview when onboarding was already completed', () => {
    localStorage.setItem(ACCESS_KEY, 'true')
    localStorage.setItem('cw_tour_onboarding_complete', 'true')

    renderBeginPage()

    fireEvent.click(screen.getByRole('button', { name: /roma antica/i }))
    fireEvent.click(screen.getByRole('button', { name: /begin — roma antica/i }))

    expect(screen.queryByTestId('tour-route-preview')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /turn on location/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enable location & begin/i })).toBeInTheDocument()
  })

  it('shows resume prompt for purchasers with an in-progress journey', () => {
    localStorage.setItem(ACCESS_KEY, 'true')
    transitionJourney(JOURNEY_STATES.WALKING, {
      currentSequenceIndex: 2,
      completedWaypointIds: ['w01'],
    })

    renderBeginPage()

    expect(screen.getByRole('heading', { name: /rome kept your place/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue walking/i })).toBeInTheDocument()
  })
})
