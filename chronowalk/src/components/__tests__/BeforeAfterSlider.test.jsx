import { describe, expect, it, vi, beforeEach } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import BeforeAfterSlider from '../BeforeAfterSlider'

const { useReducedMotionMock } = vi.hoisted(() => ({
  useReducedMotionMock: vi.fn(() => false),
}))

vi.mock('react-compare-slider', () => ({
  ReactCompareSlider: ({ handle, defaultPosition, transition, disabled }) => (
    <div
      data-testid="compare-slider"
      data-default-position={defaultPosition}
      data-transition={transition ?? ''}
      data-disabled={disabled ? 'true' : 'false'}
    >
      {handle}
    </div>
  ),
  ReactCompareSliderImage: ({ alt }) => <img alt={alt} />,
}))

vi.mock('../../hooks/useDeviceTilt', () => ({
  useDeviceTilt: () => ({ x: 0, y: 0, isActive: false, recalibrate: vi.fn() }),
}))

vi.mock('../../hooks/useReducedMotion', () => ({
  useReducedMotion: () => useReducedMotionMock(),
}))

describe('BeforeAfterSlider', () => {
  beforeEach(() => {
    useReducedMotionMock.mockReturnValue(false)
    class ResizeObserverMock {
      constructor(callback) {
        this.callback = callback
      }

      observe(element) {
        Object.defineProperty(element, 'clientWidth', {
          configurable: true,
          value: 800,
        })
        Object.defineProperty(element, 'clientHeight', {
          configurable: true,
          value: 450,
        })

        const parent = element.parentElement
        if (parent) {
          Object.defineProperty(parent, 'clientHeight', {
            configurable: true,
            value: 720,
          })
        }

        this.callback([{ target: element }], this)
      }

      disconnect() {}
      unobserve() {}
    }
    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0)
      return 1
    })
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

  it('starts the reveal wipe at the edge when startImmersive is true', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1)

    render(
      <BeforeAfterSlider
        modernImg="/modern.jpg"
        historicImg="/ancient.jpg"
        startImmersive
      />
    )

    const slider = screen.getByTestId('compare-slider')
    expect(slider).toHaveAttribute('data-default-position', '0')
    expect(slider).toHaveAttribute('data-transition', '0.85s var(--spring)')
    expect(slider).toHaveAttribute('data-disabled', 'true')
  })

  it('skips the reveal wipe when reduced motion is enabled', () => {
    useReducedMotionMock.mockReturnValue(true)
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1)

    render(
      <BeforeAfterSlider
        modernImg="/modern.jpg"
        historicImg="/ancient.jpg"
        startImmersive
      />
    )

    const slider = screen.getByTestId('compare-slider')
    expect(slider).toHaveAttribute('data-default-position', '50')
    expect(slider).toHaveAttribute('data-transition', '')
    expect(slider).toHaveAttribute('data-disabled', 'false')
  })
})
