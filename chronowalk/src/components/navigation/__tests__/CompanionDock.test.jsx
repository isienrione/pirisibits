import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import CompanionDock from '../CompanionDock.jsx'
import { beginJourney, resetJourney } from '../../../state/journey.js'

function renderDock(initialPath = '/journey') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="*" element={<CompanionDock />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('CompanionDock', () => {
  beforeEach(() => {
    localStorage.clear()
    resetJourney()
  })

  it('hides when the journey is idle', () => {
    renderDock()
    expect(screen.queryByLabelText(/companion navigation/i)).not.toBeInTheDocument()
  })

  it('shows companion links during an active journey', () => {
    beginJourney({ pace: 'classic' })
    renderDock('/map')

    expect(screen.getByLabelText(/companion navigation/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Map' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Letter' })).toBeInTheDocument()
  })
})
