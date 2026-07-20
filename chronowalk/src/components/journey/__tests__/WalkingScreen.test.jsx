import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import WalkingScreen from '../WalkingScreen.jsx'
import { LOCATION_STATUS } from '../../../hooks/useGeoLocation.js'
import { COMPANION_MODES } from '../../../content/companionGuidance.js'

function renderWalkingScreen(props) {
  return render(
    <MemoryRouter>
      <WalkingScreen {...props} />
    </MemoryRouter>
  )
}

describe('WalkingScreen', () => {
  it('shows GPS recovery when location is denied', () => {
    const onRetry = vi.fn()
    renderWalkingScreen({
      title: 'The Colosseum',
      subtitle: 'Approach line',
      distance: 120,
      locationStatus: LOCATION_STATUS.DENIED,
      onRetryLocation: onRetry,
    })

    expect(screen.getByText(/location access is off/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /try location again/i }))
    expect(onRetry).toHaveBeenCalled()
  })

  it('hides GPS notice while waiting for a fix', () => {
    renderWalkingScreen({
      title: 'The Colosseum',
      subtitle: 'Approach line',
      distance: null,
      locationStatus: LOCATION_STATUS.WAITING,
    })

    expect(screen.queryByText(/location access is off/i)).not.toBeInTheDocument()
    expect(screen.getByText(/finding your position/i)).toBeInTheDocument()
  })

  it('shows companion off-route guidance', () => {
    renderWalkingScreen({
      title: 'The Forum',
      subtitle: 'Approach line',
      distance: 520,
      companionMode: COMPANION_MODES.OFF_ROUTE,
    })

    expect(screen.getByText(/off route/i)).toBeInTheDocument()
    expect(screen.getByText(/farther from the path/i)).toBeInTheDocument()
  })
})
