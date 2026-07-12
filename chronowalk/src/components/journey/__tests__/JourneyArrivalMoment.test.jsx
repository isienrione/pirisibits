import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import JourneyArrivalMoment from '../JourneyArrivalMoment'

describe('JourneyArrivalMoment', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows ceremonial arrival copy without controls at first', () => {
    render(<JourneyArrivalMoment stopTitle="Colosseum" onContinue={vi.fn()} />)

    expect(screen.getByTestId('journey-arrival-moment')).toBeInTheDocument()
    expect(screen.getByText("You've arrived.")).toBeInTheDocument()
    expect(screen.queryByTestId('journey-arrival-action')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /open story/i })).not.toBeInTheDocument()
  })

  it('reveals the next action after the ceremonial hold', () => {
    render(<JourneyArrivalMoment stopTitle="Colosseum" onContinue={vi.fn()} holdMs={2000} />)

    act(() => {
      vi.advanceTimersByTime(1999)
    })
    expect(screen.queryByRole('button', { name: /open story/i })).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(screen.getByTestId('journey-arrival-action')).toBeInTheDocument()
    expect(screen.getByText('Colosseum')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /open story/i })).toBeInTheDocument()
  })

  it('continues into story when the revealed action is chosen', () => {
    const onContinue = vi.fn()

    render(<JourneyArrivalMoment stopTitle="Colosseum" onContinue={onContinue} holdMs={0} />)

    act(() => {
      vi.advanceTimersByTime(400)
    })

    fireEvent.click(screen.getByRole('button', { name: /open story/i }))
    expect(onContinue).toHaveBeenCalledTimes(1)
  })
})
