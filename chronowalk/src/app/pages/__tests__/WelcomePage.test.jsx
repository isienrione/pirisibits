import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { WelcomePage } from '../WelcomePage'
import { ACCESS_KEY } from '../../../lib/config'
import { JOURNEY_STATES } from '../../../state/journey'
import { transitionJourney } from '../../../state/journey'

function renderWelcomePage(initialPath = '/welcome') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/welcome" element={<WelcomePage />} />
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

  it('redirects purchasers without an active journey to begin', () => {
    localStorage.setItem(ACCESS_KEY, 'true')

    renderWelcomePage()

    expect(screen.getByText('Begin route')).toBeInTheDocument()
  })

  it('redirects purchasers with an in-progress journey to journey', () => {
    localStorage.setItem(ACCESS_KEY, 'true')
    transitionJourney(JOURNEY_STATES.WALKING)

    renderWelcomePage()

    expect(screen.getByText('Journey route')).toBeInTheDocument()
  })
})
