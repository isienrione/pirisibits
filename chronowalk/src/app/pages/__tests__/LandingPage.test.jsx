import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LandingPage } from '../LandingPage'
import { ACCESS_KEY } from '../../../lib/config'
import { markAppEntryComplete } from '../../../lib/appEntry.js'
import { JOURNEY_STATES, transitionJourney } from '../../../state/journey'

function renderLandingPage() {
  return render(
    <MemoryRouter initialEntries={['/landing']}>
      <Routes>
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/setup" element={<div>Setup route</div>} />
        <Route path="/begin" element={<div>Begin route</div>} />
        <Route path="/journey" element={<div>Journey route</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('LandingPage', () => {
  beforeEach(() => {
    localStorage.clear()
    transitionJourney(JOURNEY_STATES.IDLE)
  })

  it('renders the landing screen for visitors without access', () => {
    renderLandingPage()

    expect(screen.getByRole('heading', { name: /walk where rome/i })).toBeInTheDocument()
  })

  it('redirects new purchasers into app entry setup', () => {
    localStorage.setItem(ACCESS_KEY, 'true')

    renderLandingPage()

    expect(screen.getByText('Setup route')).toBeInTheDocument()
  })

  it('redirects purchasers who finished app entry to begin', () => {
    localStorage.setItem(ACCESS_KEY, 'true')
    markAppEntryComplete()

    renderLandingPage()

    expect(screen.getByText('Begin route')).toBeInTheDocument()
  })

  it('redirects purchasers with an in-progress journey to journey', () => {
    localStorage.setItem(ACCESS_KEY, 'true')
    transitionJourney(JOURNEY_STATES.WALKING)

    renderLandingPage()

    expect(screen.getByText('Journey route')).toBeInTheDocument()
  })
})
