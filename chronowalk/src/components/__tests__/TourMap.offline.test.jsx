import { beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  }
})

vi.mock('../../map/mapboxLoader.js', () => ({
  loadMapboxRuntime: vi.fn(() => Promise.reject(new Error('mapbox offline'))),
}))

vi.mock('../../config/env', async () => {
  const actual = await vi.importActual('../../config/env')
  return {
    ...actual,
    env: { ...actual.env, mapboxToken: 'pk.test' },
    isMapboxConfigured: () => true,
  }
})

import TourMap from '../TourMap.jsx'

const stops = [
  {
    id: 'colosseum',
    title: 'Colosseum',
    status: 'current',
    landmark: { lat: 41.8902, lng: 12.4922 },
  },
  {
    id: 'roman-forum',
    title: 'Roman Forum',
    status: 'upcoming',
    landmark: { lat: 41.8925, lng: 12.4853 },
  },
]

describe('TourMap offline', () => {
  it('mounts OfflineRouteMap immediately when isOffline (no grey Mapbox canvas)', () => {
    render(
      <TourMap
        tour={{ id: 'rome-core', stopIds: ['colosseum', 'roman-forum'], bounds: { center: { lat: 41.89, lng: 12.49 } } }}
        stops={stops}
        activeTargetId="colosseum"
        userPos={{ lat: 41.8898, lng: 12.4915 }}
        isOffline
        walkingCompanionUI
        fillContainer
        minimalUI
      />,
    )

    expect(screen.getByTestId('offline-route-map-compact')).toBeInTheDocument()
    expect(screen.getByLabelText(/simplified tour route overview/i)).toBeInTheDocument()
    expect(screen.getByText(/offline route sketch/i)).toBeInTheDocument()
  })

  it('does not stay on OfflineRouteMap when online even if preferOfflineStyle is set', () => {
    render(
      <TourMap
        tour={{ id: 'rome-core', stopIds: ['colosseum', 'roman-forum'], bounds: { center: { lat: 41.89, lng: 12.49 } } }}
        stops={stops}
        activeTargetId="colosseum"
        userPos={{ lat: 41.8898, lng: 12.4915 }}
        isOffline={false}
        preferOfflineStyle
        walkingCompanionUI
        fillContainer
        minimalUI
      />,
    )

    expect(screen.queryByTestId('offline-route-map-compact')).not.toBeInTheDocument()
  })

  it('leaves OfflineRouteMap when reconnecting after offline', () => {
    const { rerender } = render(
      <TourMap
        tour={{ id: 'rome-core', stopIds: ['colosseum', 'roman-forum'], bounds: { center: { lat: 41.89, lng: 12.49 } } }}
        stops={stops}
        activeTargetId="colosseum"
        userPos={{ lat: 41.8898, lng: 12.4915 }}
        isOffline
        walkingCompanionUI
        fillContainer
        minimalUI
      />,
    )
    expect(screen.getByTestId('offline-route-map-compact')).toBeInTheDocument()

    rerender(
      <TourMap
        tour={{ id: 'rome-core', stopIds: ['colosseum', 'roman-forum'], bounds: { center: { lat: 41.89, lng: 12.49 } } }}
        stops={stops}
        activeTargetId="colosseum"
        userPos={{ lat: 41.8898, lng: 12.4915 }}
        isOffline={false}
        walkingCompanionUI
        fillContainer
        minimalUI
      />,
    )
    expect(screen.queryByTestId('offline-route-map-compact')).not.toBeInTheDocument()
  })
})
