import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import {
  computeOverlayFramePoints,
  summarizeTransitMapPayload,
} from '../nativeMapDiagnostics.js'

describe('nativeMapDiagnostics', () => {
  it('summarizes payload without coordinates', () => {
    expect(
      summarizeTransitMapPayload({
        cityId: 'rome',
        frame: { x: 10.2, y: 80.6, width: 320, height: 200 },
        routeGeoJSON: { type: 'LineString', coordinates: [[12.49, 41.89]] },
        origin: { lat: 41.89, lng: 12.49 },
        destination: { lat: 41.9, lng: 12.48 },
        currentPosition: null,
      }),
    ).toEqual({
      cityId: 'rome',
      hasFrame: true,
      frame: { x: 10.2, y: 80.6, width: 320, height: 200 },
      hasRoute: true,
      hasOrigin: true,
      hasDestination: true,
      hasCurrentPosition: false,
    })
  })

  it('computes overlay frames in CSS/UIKit points without devicePixelRatio scaling', () => {
    expect(
      computeOverlayFramePoints(
        { x: 12, y: 100, width: 300, height: 180 },
        { x: 0, y: 47 },
      ),
    ).toEqual({ x: 12, y: 147, width: 300, height: 180 })

    // Regression: multiplying by devicePixelRatio would push the map off-screen.
    const dpr = 3
    const wrong = {
      x: 12 * dpr,
      y: 100 * dpr,
      width: 300 * dpr,
      height: 180 * dpr,
    }
    expect(wrong.width).toBeGreaterThan(300)
    expect(
      computeOverlayFramePoints({ x: 12, y: 100, width: 300, height: 180 }),
    ).toEqual({ x: 12, y: 100, width: 300, height: 180 })
  })
})

describe('NativeTransitMapPane invalid frame fallback', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('falls back when the map slot never gets a measurable frame', async () => {
    vi.doMock('../nativeTransitMap.js', () => ({
      openTransitMap: vi.fn(),
      updateTransitMap: vi.fn(),
      closeTransitMap: vi.fn(async () => ({ closed: true })),
      setTransitMapVisible: vi.fn(async () => ({ visible: true })),
    }))
    vi.doMock('../../../content/mapStops.js', () => ({
      resolveActiveMapLeg: () => ({ activeTargetId: 'pantheon' }),
    }))

    Element.prototype.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      right: 0,
      bottom: 0,
      toJSON() {
        return {}
      },
    })

    const { default: NativeTransitMapPane } = await import(
      '../../../components/journey/NativeTransitMapPane.jsx'
    )

    render(
      <NativeTransitMapPane
        cityId="rome"
        destination={{ lat: 41.9, lng: 12.48 }}
      />,
    )

    await waitFor(
      () => {
        expect(screen.getByTestId('native-transit-map-fallback')).toBeInTheDocument()
        expect(screen.getByTestId('native-transit-map-fallback')).toHaveTextContent(
          /Map unavailable/i,
        )
        expect(screen.getByTestId('native-transit-map-fallback')).toHaveTextContent(
          /invalid_frame/i,
        )
      },
      { timeout: 3000 },
    )
  })
})
