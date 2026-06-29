import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import TourOverviewView from '../TourOverviewView'
import { JOURNEY_STATE } from '../../../hooks/useGeoLocation'
import { ROME_CORE_TOUR } from '../../../data/rome-core-tour'
import { NAV_TABS } from '../../navigation/navConfig'

const baseProgress = {
  targetStopIndex: 0,
  transitLegActive: false,
}

describe('TourOverviewView', () => {
  it('renders journey status when in transit', () => {
    render(
      <TourOverviewView
        tour={ROME_CORE_TOUR}
        progress={baseProgress}
        mapStops={[]}
        waypointsById={{}}
        targetStopId={ROME_CORE_TOUR.stopIds[0]}
        nextWaypoint={{ title: 'Next landmark' }}
        state={JOURNEY_STATE.TRANSIT}
        distance={120}
        transitLegActive={false}
        isAwaitingFirstStop={false}
        onNavigate={vi.fn()}
        onOpenStop={vi.fn()}
      />
    )

    expect(screen.getByText(/en route/i)).toBeInTheDocument()
    expect(screen.getByText(/next landmark/i)).toBeInTheDocument()
    expect(screen.getByText(/120 m/i)).toBeInTheDocument()
  })

  it('shows at-stop status and hides next/distance when arrived', () => {
    render(
      <TourOverviewView
        tour={ROME_CORE_TOUR}
        progress={baseProgress}
        mapStops={[]}
        waypointsById={{}}
        targetStopId={ROME_CORE_TOUR.stopIds[0]}
        nextWaypoint={{ title: 'Next landmark' }}
        state={JOURNEY_STATE.ARRIVAL}
        distance={0}
        transitLegActive={false}
        isAwaitingFirstStop={false}
        onNavigate={vi.fn()}
        onOpenStop={vi.fn()}
      />
    )

    expect(screen.getByText(/at stop/i)).toBeInTheDocument()
    expect(screen.queryByText(/next landmark/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/distance:/i)).not.toBeInTheDocument()
  })

  it('renders empty state when no tour is selected', () => {
    render(
      <TourOverviewView
        tour={null}
        onNavigate={vi.fn()}
      />
    )

    expect(screen.getByText(/single-stop mode/i)).toBeInTheDocument()
  })

  it('opens map when the primary CTA is clicked', () => {
    const onNavigate = vi.fn()

    render(
      <TourOverviewView
        tour={ROME_CORE_TOUR}
        progress={baseProgress}
        mapStops={[]}
        waypointsById={{}}
        targetStopId={ROME_CORE_TOUR.stopIds[0]}
        state={JOURNEY_STATE.TRANSIT}
        transitLegActive={false}
        isAwaitingFirstStop={false}
        onNavigate={onNavigate}
        onOpenStop={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /open map/i }))

    expect(onNavigate).toHaveBeenCalledWith(NAV_TABS.MAP)
  })
})
