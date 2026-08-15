import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LandingZoomableImageViewer } from '../v4/LandingPackagePosterViewer.jsx'

vi.mock('../../hooks/useReducedMotion.js', () => ({
  useReducedMotion: () => true,
}))

vi.mock('../../utils/safariPageZoom.js', () => ({
  installSafariPageZoomBlock: () => () => {},
  attemptSafariZoomRecovery: () => {},
}))

describe('LandingZoomableImageViewer hotspots', () => {
  it('fires onHotspotSelect when a sticker hotspot is activated', () => {
    const onHotspotSelect = vi.fn()
    const onClose = vi.fn()

    render(
      <LandingZoomableImageViewer
        open
        title="Route"
        src="/landing/hero-slides/package-roma-eterna-route.png"
        width={1024}
        height={1244}
        hotspots={[
          {
            id: 'art-1',
            waypointId: 'w01',
            label: 'Colosseum exterior',
            left: 68,
            top: 3,
            width: 10,
            height: 6,
          },
        ]}
        onHotspotSelect={onHotspotSelect}
        onClose={onClose}
      />,
    )

    fireEvent.click(screen.getByTestId('route-hotspot-w01'))
    expect(onHotspotSelect).toHaveBeenCalledWith(
      expect.objectContaining({ waypointId: 'w01', id: 'art-1' }),
    )
  })
})
