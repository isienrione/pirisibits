import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { BeginPage } from '../BeginPage'
import { ACCESS_KEY } from '../../../lib/config'
import { JOURNEY_STATES, transitionJourney } from '../../../state/journey'

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
    transitionJourney(JOURNEY_STATES.IDLE)
  })

  it('redirects visitors without access to landing', () => {
    renderBeginPage()

    expect(screen.getByText('Landing route')).toBeInTheDocument()
  })

  it('renders the begin flow for purchasers without an active journey', () => {
    localStorage.setItem(ACCESS_KEY, 'true')

    renderBeginPage()

    expect(screen.getByRole('heading', { name: /rome is yours/i })).toBeInTheDocument()
  })

  it('redirects purchasers with an in-progress journey to journey', () => {
    localStorage.setItem(ACCESS_KEY, 'true')
    transitionJourney(JOURNEY_STATES.WALKING)

    renderBeginPage()

    expect(screen.getByText('Journey route')).toBeInTheDocument()
  })
})
