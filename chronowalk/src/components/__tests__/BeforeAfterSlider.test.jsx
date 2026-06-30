import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import BeforeAfterSlider from '../BeforeAfterSlider'

vi.mock('react-compare-slider', () => ({
  ReactCompareSlider: ({ handle }) => <div data-testid="compare-slider">{handle}</div>,
  ReactCompareSliderImage: ({ alt }) => <img alt={alt} />,
}))

vi.mock('../../hooks/useDeviceTilt', () => ({
  useDeviceTilt: () => ({ x: 0, y: 0, isActive: false, recalibrate: vi.fn() }),
}))

describe('BeforeAfterSlider', () => {
  beforeEach(() => {
    class ResizeObserverMock {
      observe() {}
      disconnect() {}
      unobserve() {}
    }
    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
  })

  it('opens immersive mode on mount when startImmersive is true', () => {
    render(
      <BeforeAfterSlider
        modernImg="/modern.mp4"
        historicImg="/ancient.mp4"
        startImmersive
      />
    )

    expect(screen.getByLabelText(/close full screen compare view/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/open full screen compare view/i)).not.toBeInTheDocument()
  })

  it('keeps the in-card compare chrome when startImmersive is false', () => {
    render(
      <BeforeAfterSlider
        modernImg="/modern.mp4"
        historicImg="/ancient.mp4"
        embedded
      />
    )

    expect(screen.getByLabelText(/open full screen compare view/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/close full screen compare view/i)).not.toBeInTheDocument()
  })

  it('mounts the hidden duotone filter definition when duotone is enabled', () => {
    const { rerender } = render(
      <BeforeAfterSlider
        modernImg="/modern.jpg"
        historicImg="/ancient.jpg"
        embedded
        duotone
      />
    )

    expect(document.querySelector('filter')).toBeTruthy()

    rerender(
      <BeforeAfterSlider
        modernImg="/modern.jpg"
        historicImg="/ancient.jpg"
        embedded
        duotone={false}
      />
    )

    expect(document.querySelector('filter')).toBeNull()
  })
})
