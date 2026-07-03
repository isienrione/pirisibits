import { describe, expect, it, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { BeginPage } from '../BeginPage'
import { ACCESS_KEY } from '../../../lib/config'
import { JOURNEY_STATES, transitionJourney } from '../../../state/journey'
import manifest from '../../../../public/tours/rome/manifest.json'

vi.mock('../../../hooks/useJourney', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useTourManifest: () => ({
      manifest,
      loading: false,
      error: null,
    }),
  }
})

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

    expect(screen.getByRole('heading', { name: /which day of rome/i })).toBeInTheDocument()
  })

  it('redirects purchasers with an in-progress journey to journey', () => {
    localStorage.setItem(ACCESS_KEY, 'true')
    transitionJourney(JOURNEY_STATES.WALKING)

    renderBeginPage()

    expect(screen.getByText('Journey route')).toBeInTheDocument()
  })
})
