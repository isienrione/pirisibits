import { describe, expect, it, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { BeginPage } from '../BeginPage'
import { grantTestAccess } from '../../../test/grantTestAccess.js'
import { markAppEntryComplete } from '../../../lib/appEntry.js'
import { JOURNEY_STATES, resetJourney, transitionJourney } from '../../../state/journey'

function renderBeginPage(path = '/begin') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/begin" element={<BeginPage />} />
        <Route path="/" element={<div>Landing route</div>} />
        <Route path="/setup" element={<div>Setup route</div>} />
        <Route path="/home" element={<div>Home route</div>} />
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

  it('skips pace selection by default and opens the route preview for Roma Eterna', () => {
    grantTestAccess()
    markAppEntryComplete()

    renderBeginPage()

    expect(screen.queryByTestId('app-begin-home')).not.toBeInTheDocument()
    expect(screen.getByTestId('tour-route-preview')).toBeInTheDocument()
    expect(screen.getByText(/your route/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enable location & begin/i })).toBeInTheDocument()
  })

  it('opens the pace picker when Settings asks to change or customize the route', () => {
    grantTestAccess()
    markAppEntryComplete()

    renderBeginPage('/begin?chooseRoute=1')

    expect(screen.getByTestId('app-begin-home')).toBeInTheDocument()
    expect(screen.getByText(/your walk/i)).toBeInTheDocument()
    expect(screen.getByText(/choose how/i)).toBeInTheDocument()
    expect(screen.queryByTestId('tour-route-preview')).not.toBeInTheDocument()
  })

  it('shows pace-aware route preview after choosing a pace from Settings', () => {
    grantTestAccess()
    markAppEntryComplete()

    renderBeginPage('/begin?chooseRoute=1')

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

    expect(screen.queryByTestId('tour-route-preview')).not.toBeInTheDocument()
    expect(screen.getByText(/enable location for gps guidance/i)).toBeInTheDocument()
  })

  it('sends purchasers with an in-progress journey to home instead of cinematic resume', () => {
    grantTestAccess()
    markAppEntryComplete()
    transitionJourney(JOURNEY_STATES.WALKING, {
      currentSequenceIndex: 2,
      completedWaypointIds: ['w01'],
    })

    renderBeginPage()

    expect(screen.getByText('Home route')).toBeInTheDocument()
  })

  it('still shows resume UI when explicitly requested', () => {
    grantTestAccess()
    markAppEntryComplete()
    transitionJourney(JOURNEY_STATES.WALKING, {
      currentSequenceIndex: 2,
      completedWaypointIds: ['w01'],
    })

    renderBeginPage('/begin?resume=1')

    expect(screen.getByRole('heading', { name: /rome kept your place/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue your walk/i })).toBeInTheDocument()
  })

  it('lets an in-progress traveler open the pace picker from Settings', () => {
    grantTestAccess()
    transitionJourney(JOURNEY_STATES.WALKING, {
      currentSequenceIndex: 2,
      completedWaypointIds: ['w01'],
    })

    renderBeginPage('/begin?chooseRoute=1')

    expect(screen.getByTestId('app-begin-home')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /rome kept your place/i })).not.toBeInTheDocument()
  })
})
