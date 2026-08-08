import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import JourneyInlineMap from '../JourneyInlineMap.jsx'

vi.mock('../../../platform/offlineMaps/nativeTransitMap.js', () => ({
  shouldUseNativeTransitMap: vi.fn(),
  openTransitMap: vi.fn(async () => ({ opened: true, renderer: 'mapbox-maps-ios' })),
  updateTransitMap: vi.fn(async () => ({ updated: true })),
  closeTransitMap: vi.fn(async () => ({ closed: true })),
  setTransitMapVisible: vi.fn(async () => ({ visible: true })),
}))

vi.mock('../../../utils/lazyWithRecovery.js', () => ({
  lazyWithRecovery: () => {
    function TourMapStub() {
      return <div data-testid="web-tour-map-stub">web TourMap</div>
    }
    return TourMapStub
  },
}))

vi.mock('../../../hooks/useNetworkStatus.js', () => ({
  useNetworkStatus: () => ({ isOffline: false }),
}))

vi.mock('../../../audio/offlinePackage.js', () => ({
  hasCachedRomeMapTiles: () => false,
}))

vi.mock('../../../map/offlineMapTiles.js', () => ({
  hydrateRomeMapTileCache: vi.fn(async () => {}),
}))

vi.mock('../../../content/mapStops.js', () => ({
  buildManifestTour: () => ({ id: 'rome' }),
  buildMapStopsFromManifest: () => [
    {
      id: 'colosseum',
      landmark: { lat: 41.8902, lng: 12.4922 },
      arrivalRadiusM: 40,
    },
    {
      id: 'pantheon',
      landmark: { lat: 41.8986, lng: 12.4768 },
      arrivalRadiusM: 40,
    },
  ],
  resolveActiveMapLeg: () => ({
    activeTargetId: 'pantheon',
    activeLeg: { fromId: 'colosseum', toId: 'pantheon' },
    transitLegActive: true,
  }),
}))

import {
  closeTransitMap,
  openTransitMap,
  shouldUseNativeTransitMap,
} from '../../../platform/offlineMaps/nativeTransitMap.js'

const baseProps = {
  manifest: { id: 'rome' },
  context: {
    path: 'essential',
    currentSequenceIndex: 1,
    completedWaypointIds: [],
    promotedOptionalIds: [],
  },
  geo: { position: null, state: 'TRANSIT', distance: null },
  directionsGeometry: {
    type: 'LineString',
    coordinates: [
      [12.4922, 41.8902],
      [12.4768, 41.8986],
    ],
  },
  directionsModeActive: true,
}

describe('JourneyInlineMap native vs web', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses native transit map host on iOS and does not mount TourMap', async () => {
    vi.mocked(shouldUseNativeTransitMap).mockReturnValue(true)
    // Provide a measurable host rect for openTransitMap.
    const original = Element.prototype.getBoundingClientRect
    Element.prototype.getBoundingClientRect = () => ({
      left: 0,
      top: 100,
      width: 320,
      height: 240,
      x: 0,
      y: 100,
      right: 320,
      bottom: 340,
      toJSON() {
        return {}
      },
    })

    render(<JourneyInlineMap {...baseProps} />)

    expect(screen.getByTestId('native-transit-map-host')).toBeInTheDocument()
    expect(screen.queryByTestId('web-tour-map-stub')).not.toBeInTheDocument()

    await waitFor(() => {
      expect(openTransitMap).toHaveBeenCalled()
    })

    const payload = openTransitMap.mock.calls[0][0]
    expect(payload.routeGeoJSON).toEqual(baseProps.directionsGeometry)
    expect(payload.destination).toMatchObject({
      lat: 41.8986,
      lng: 12.4768,
    })
    expect(payload.currentPosition).toBeNull()

    Element.prototype.getBoundingClientRect = original
  })

  it('keeps web TourMap path off native iOS', () => {
    vi.mocked(shouldUseNativeTransitMap).mockReturnValue(false)
    render(<JourneyInlineMap {...baseProps} />)
    expect(screen.getByTestId('web-tour-map-stub')).toBeInTheDocument()
    expect(screen.queryByTestId('native-transit-map-host')).not.toBeInTheDocument()
    expect(openTransitMap).not.toHaveBeenCalled()
  })

  it('shows controlled fallback when native open fails and preserves no GL JS mount', async () => {
    vi.mocked(shouldUseNativeTransitMap).mockReturnValue(true)
    vi.mocked(openTransitMap).mockResolvedValue({
      opened: false,
      errorCode: 'mapbox_not_configured',
    })
    Element.prototype.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
      x: 0,
      y: 0,
      right: 100,
      bottom: 100,
      toJSON() {
        return {}
      },
    })

    render(<JourneyInlineMap {...baseProps} />)

    await waitFor(() => {
      expect(screen.getByTestId('native-transit-map-fallback')).toHaveTextContent(
        /Map unavailable right now — you can still follow step directions or open the stop/i,
      )
    })
    expect(screen.queryByTestId('web-tour-map-stub')).not.toBeInTheDocument()
  })

  it('closes native map on unmount', async () => {
    vi.mocked(shouldUseNativeTransitMap).mockReturnValue(true)
    Element.prototype.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
      x: 0,
      y: 0,
      right: 100,
      bottom: 100,
      toJSON() {
        return {}
      },
    })
    const { unmount } = render(<JourneyInlineMap {...baseProps} />)
    unmount()
    await waitFor(() => {
      expect(closeTransitMap).toHaveBeenCalled()
    })
  })
})
