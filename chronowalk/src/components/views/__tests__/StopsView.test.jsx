import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import StopsView from '../StopsView'
import { NAV_TABS } from '../../navigation/navConfig'

const tour = {
  id: 'rome-core',
  title: 'Heart of Ancient Rome',
  stopIds: ['colosseum', 'pantheon'],
}

const mapStops = [
  { id: 'colosseum', title: 'Colosseum', status: 'completed' },
  { id: 'pantheon', title: 'Pantheon', status: 'current' },
]

describe('StopsView', () => {
  it('renders premium stop cards with status badges', () => {
    render(
      <StopsView
        tour={tour}
        mapStops={mapStops}
        waypointsById={{}}
        onNavigate={vi.fn()}
      />
    )

    expect(screen.getByRole('heading', { name: /heart of ancient rome/i })).toBeInTheDocument()
    expect(screen.getByText('Colosseum')).toBeInTheDocument()
    expect(screen.getByText('Pantheon')).toBeInTheDocument()
    expect(screen.getByText('Visited')).toBeInTheDocument()
    expect(screen.getByText('Current')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /revisit/i })).toBeInTheDocument()
  })

  it('requests opening a stop and navigates to the map', () => {
    const onOpenStop = vi.fn()
    const onNavigate = vi.fn()
    render(
      <StopsView
        tour={tour}
        mapStops={mapStops}
        waypointsById={{}}
        onOpenStop={onOpenStop}
        onNavigate={onNavigate}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /revisit/i }))

    expect(onOpenStop).toHaveBeenCalledWith('colosseum')
    expect(onNavigate).toHaveBeenCalled()
  })
})
