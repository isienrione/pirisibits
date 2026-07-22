import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { WelcomePage } from '../WelcomePage'
import { grantTestAccess } from '../../../test/grantTestAccess.js'
import { markAppEntryComplete } from '../../../lib/appEntry.js'
import { JOURNEY_STATES, transitionJourney } from '../../../state/journey'

function renderWelcomePage(initialPath = '/welcome') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/setup" element={<div>Setup route</div>} />
        <Route path="/begin" element={<div>Begin route</div>} />
        <Route path="/journey" element={<div>Journey route</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('WelcomePage', () => {
  beforeEach(() => {
    localStorage.clear()
    transitionJourney(JOURNEY_STATES.IDLE)
  })

  it('renders the welcome flow for visitors without access', () => {
    renderWelcomePage()

    expect(screen.getByText('ChronoWalk')).toBeInTheDocument()
  })

  it('redirects new purchasers into app entry setup', () => {
    grantTestAccess()

    renderWelcomePage()

    expect(screen.getByText('Setup route')).toBeInTheDocument()
  })

  it('redirects purchasers who finished app entry to begin', () => {
    grantTestAccess()
    markAppEntryComplete()

    renderWelcomePage()

    expect(screen.getByText('Begin route')).toBeInTheDocument()
  })

  it('redirects purchasers with an in-progress journey to journey', () => {
    grantTestAccess()
    transitionJourney(JOURNEY_STATES.WALKING)

    renderWelcomePage()

    expect(screen.getByText('Journey route')).toBeInTheDocument()
  })
})
