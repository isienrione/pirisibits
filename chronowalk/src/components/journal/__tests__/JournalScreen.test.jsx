import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import JournalScreen from '../JournalScreen.jsx'
import { beginJourney, resetJourney } from '../../../state/journey.js'

function renderJournal() {
  return render(
    <MemoryRouter>
      <JournalScreen />
    </MemoryRouter>
  )
}

describe('JournalScreen', () => {
  beforeEach(() => {
    localStorage.clear()
    resetJourney()
  })

  it('renders the bone timeline with the first current stop', async () => {
    beginJourney({ pace: 'classic' })
    renderJournal()

    expect(await screen.findByRole('heading', { name: /your rome is still ahead/i })).toBeInTheDocument()
    expect(screen.getByText('The Colosseum')).toBeInTheDocument()
    expect(screen.getByText('Current stop')).toBeInTheDocument()
    expect(screen.getByText('Return to walk')).toBeInTheDocument()
  })

  it('shows begin journey when idle', async () => {
    renderJournal()

    expect(await screen.findByRole('heading', { name: /your rome is still ahead/i })).toBeInTheDocument()
    expect(screen.getByText('Begin journey')).toBeInTheDocument()
  })
})
