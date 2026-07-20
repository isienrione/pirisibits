import { describe, expect, it, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LetterScreen from '../LetterScreen.jsx'
import { beginJourney, resetJourney } from '../../../state/journey.js'

vi.mock('../letterExport.js', () => ({
  saveLetterCard: vi.fn().mockResolvedValue(true),
  shareLetterCard: vi.fn().mockResolvedValue('share'),
}))

vi.mock('../../../lib/track.js', () => ({
  track: vi.fn(),
  TRACK_EVENTS: {
    LETTER_VIEW: 'letter_view',
    LETTER_SAVE: 'letter_save',
    LETTER_SHARE: 'letter_share',
  },
}))

function renderLetter() {
  return render(
    <MemoryRouter>
      <LetterScreen />
    </MemoryRouter>
  )
}

describe('LetterScreen', () => {
  beforeEach(() => {
    localStorage.clear()
    resetJourney()
  })

  it('shows preview copy before any stops are completed', async () => {
    renderLetter()

    expect(await screen.findByRole('heading', { name: /your letter awaits/i })).toBeInTheDocument()
    expect(screen.getByText(/still blank/i)).toBeInTheDocument()
  })

  it('renders the meander and letter body after progress', async () => {
    beginJourney({ pace: 'classic' })
    const { markWaypointComplete } = await import('../../../state/journey.js')
    markWaypointComplete('w01')
    markWaypointComplete('w02')

    renderLetter()

    expect(await screen.findByRole('heading', { name: /the path you walked/i })).toBeInTheDocument()
    expect(screen.getByText(/Colosseum/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /share letter/i })).toBeEnabled()
  })

  it('triggers share', async () => {
    beginJourney({ pace: 'classic' })
    const { markWaypointComplete } = await import('../../../state/journey.js')
    markWaypointComplete('w01')

    const { shareLetterCard } = await import('../letterExport.js')
    renderLetter()

    fireEvent.click(await screen.findByRole('button', { name: /share letter/i }))
    expect(shareLetterCard).toHaveBeenCalled()
  })
})
