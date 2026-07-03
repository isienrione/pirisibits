import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import StopsScreen from '../StopsScreen.jsx'
import { beginJourney, resetJourney } from '../../../state/journey.js'

describe('StopsScreen', () => {
  beforeEach(() => {
    localStorage.clear()
    resetJourney()
  })

  it('renders manifest stops in the ivory shell', async () => {
    beginJourney({ pace: 'classic' })

    render(
      <MemoryRouter>
        <StopsScreen />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: /all stops/i })).toBeInTheDocument()
    expect(screen.getAllByText(/colosseum/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/current stop/i).length).toBeGreaterThan(0)
  })
})
