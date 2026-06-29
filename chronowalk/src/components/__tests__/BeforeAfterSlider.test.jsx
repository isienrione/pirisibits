import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

    expect(screen.getByRole('dialog', { name: /immersive compare/i })).toHaveAttribute(
      'aria-modal',
      'true'
    )
    expect(screen.getByLabelText(/back to landmark card/i)).toHaveFocus()
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

  it('traps focus in immersive mode and restores focus to the trigger on close', async () => {
    render(
      <BeforeAfterSlider
        modernImg="/modern.mp4"
        historicImg="/ancient.mp4"
        embedded
      />
    )

    const openButton = screen.getByLabelText(/open full screen compare view/i)
    fireEvent.click(openButton)

    const dialog = screen.getByRole('dialog', { name: /immersive compare/i })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog.contains(document.activeElement)).toBe(true)

    fireEvent.click(screen.getByLabelText(/close full screen compare view/i))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByLabelText(/open full screen compare view/i)).toHaveFocus()
  })
})
