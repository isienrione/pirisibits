import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, render, screen, act } from '@testing-library/react'
import ThresholdReveal from '../ThresholdReveal'

vi.mock('react-compare-slider', () => ({
  ReactCompareSlider: ({ handle, onPositionChange }) => (
    <div data-testid="threshold-compare-slider">
      {handle}
      <button
        type="button"
        aria-label="Reveal ancient layer"
        onClick={() => onPositionChange?.(40)}
      >
        Drag reveal
      </button>
    </div>
  ),
  ReactCompareSliderImage: ({ alt }) => <img alt={alt} />,
}))

vi.mock('../../../hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}))

describe('ThresholdReveal', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the ceremonial prelude with hold instruction', () => {
    render(
      <ThresholdReveal
        stopTitle="Colosseum"
        modernUrl="/modern.jpg"
        ancientUrl="/ancient.jpg"
      />
    )

    expect(screen.getByTestId('threshold-reveal')).toBeInTheDocument()
    expect(screen.getByText('Hold')).toBeInTheDocument()
  })

  it('unlocks the vertical compare slider after hold', () => {
    render(
      <ThresholdReveal
        stopTitle="Colosseum"
        modernUrl="/modern.jpg"
        ancientUrl="/ancient.jpg"
      />
    )

    fireEvent.pointerDown(screen.getByTestId('threshold-surface'))
    act(() => {
      vi.advanceTimersByTime(900)
    })

    expect(screen.getByTestId('threshold-compare-slider')).toBeInTheDocument()
    expect(screen.getByText('Reveal')).toBeInTheDocument()
  })

  it('completes the ceremony on release after reveal', () => {
    const onRevealComplete = vi.fn()

    render(
      <ThresholdReveal
        stopTitle="Colosseum"
        modernUrl="/modern.jpg"
        ancientUrl="/ancient.jpg"
        onRevealComplete={onRevealComplete}
      />
    )

    fireEvent.pointerDown(screen.getByTestId('threshold-surface'))
    act(() => {
      vi.advanceTimersByTime(900)
    })

    fireEvent.click(screen.getByRole('button', { name: /reveal ancient layer/i }))
    fireEvent.pointerUp(screen.getByTestId('threshold-surface'))

    expect(screen.getByText('Release')).toBeInTheDocument()

    act(() => {
      vi.runAllTimers()
    })

    expect(onRevealComplete).toHaveBeenCalledTimes(1)
  })

  it('shows a fallback when comparison media is missing', () => {
    render(
      <ThresholdReveal
        stopTitle="Colosseum"
        modernUrl={null}
        ancientUrl={null}
      />
    )

    expect(screen.getByRole('heading', { level: 1, name: /colosseum/i })).toBeInTheDocument()
    expect(screen.getByText(/being prepared/i)).toBeInTheDocument()
  })
})
