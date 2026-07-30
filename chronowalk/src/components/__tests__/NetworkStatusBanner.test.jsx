import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NetworkStatusBanner from '../NetworkStatusBanner.jsx'
import { beginJourney, resetJourney } from '../../state/journey.js'

vi.mock('../../hooks/useNetworkStatus.js', () => ({
  useNetworkStatus: () => ({ isOffline: true, isOnline: false }),
}))

describe('NetworkStatusBanner', () => {
  beforeEach(() => {
    localStorage.clear()
    resetJourney()
  })

  it('shows offline guidance during an active journey', () => {
    beginJourney({ pace: 'classic' })

    render(
      <MemoryRouter>
        <NetworkStatusBanner />
      </MemoryRouter>
    )

    expect(
      screen.getByText(
        /you're offline - cached audio and media works normally; navigation data may be unavailable on airplane mode/i,
      ),
    ).toBeInTheDocument()
  })

  it('hides while journey is idle', () => {
    render(
      <MemoryRouter>
        <NetworkStatusBanner />
      </MemoryRouter>
    )

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
