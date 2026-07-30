import { describe, expect, it, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { BeginPage } from '../BeginPage'
import { grantTestAccess } from '../../../test/grantTestAccess.js'
import { markAppEntryComplete } from '../../../lib/appEntry.js'
import { JOURNEY_STATES, resetJourney, transitionJourney } from '../../../state/journey'

function renderBeginPage() {
  return render(
    <MemoryRouter initialEntries={['/begin']}>
      <Routes>
        <Route path="/begin" element={<BeginPage />} />
        <Route path="/landing" element={<div>Landing route</div>} />
        <Route path="/setup" element={<div>Setup route</div>} />
        <Route path="/journey" element={<div>Journey route</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('BeginPage', () => {
  beforeEach(() => {
    localStorage.clear()
    resetJourney()
    transitionJourney(JOURNEY_STATES.IDLE)
  })

  it('redirects visitors without access to landing', () => {
    renderBeginPage()

    expect(screen.getByText('Landing route')).toBeInTheDocument()
  })

  it('sends unlocked travelers without app entry into setup', () => {
    grantTestAccess()

    renderBeginPage()

    expect(screen.getByText('Setup route')).toBeInTheDocument()
  })

  it('starts at app-home pace selection after entry', () => {
    grantTestAccess()
    markAppEntryComplete()

    renderBeginPage()

    expect(screen.getByTestId('app-begin-home')).toBeInTheDocument()
    expect(screen.getByText(/your walk/i)).toBeInTheDocument()
    expect(screen.getByText(/choose how/i)).toBeInTheDocument()
    expect(screen.queryByTestId('tour-route-preview')).not.toBeInTheDocument()
  })

  it('shows pace-aware route preview after choosing a pace', () => {
    grantTestAccess()
    markAppEntryComplete()

    renderBeginPage()

    fireEvent.click(screen.getByRole('button', { name: /begin - roma eterna/i }))

    expect(screen.getByTestId('tour-route-preview')).toBeInTheDocument()
    expect(screen.getByText(/your route/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enable location & begin/i })).toBeInTheDocument()
  })

  it('skips route preview when onboarding was already completed', () => {
    grantTestAccess()
    markAppEntryComplete()
    localStorage.setItem('cw_tour_onboarding_complete', 'true')

    renderBeginPage()

    fireEvent.click(screen.getByRole('button', { name: /roma antica/i }))
    fireEvent.click(screen.getByRole('button', { name: /begin - roma antica/i }))

    expect(screen.queryByTestId('tour-route-preview')).not.toBeInTheDocument()
    expect(screen.getByText(/enable location for gps guidance/i)).toBeInTheDocument()
  })

  it('shows resume prompt for purchasers with an in-progress journey', () => {
    grantTestAccess()
    transitionJourney(JOURNEY_STATES.WALKING, {
      currentSequenceIndex: 2,
      completedWaypointIds: ['w01'],
    })

    renderBeginPage()

    expect(screen.getByRole('heading', { name: /rome kept your place/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue your walk/i })).toBeInTheDocument()
  })
})
