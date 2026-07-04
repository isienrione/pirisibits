import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import JourneyStopCard from '../JourneyStopCard'

const stop = {
  id: 'colosseum',
  number: 1,
  title: 'The Colosseum',
  shortTitle: 'Colosseum',
  heroImage: '/waypoints/colosseum/modern-poster.jpg',
}

describe('JourneyStopCard', () => {
  it('renders number, title, and status for the current stop', () => {
    render(<JourneyStopCard stop={stop} status="current" onPress={vi.fn()} />)

    expect(screen.getByText('Colosseum')).toBeInTheDocument()
    expect(screen.getByText('Current')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('shows reopen hint for visited stops', () => {
    render(<JourneyStopCard stop={stop} status="visited" onPress={vi.fn()} />)

    expect(screen.getByText('Visited')).toBeInTheDocument()
    expect(screen.getByText(/tap to reopen/i)).toBeInTheDocument()
  })

  it('renders upcoming stops without a button', () => {
    render(<JourneyStopCard stop={stop} status="upcoming" />)

    expect(screen.getByText('Upcoming')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('calls onPress for visited stops', () => {
    const onPress = vi.fn()
    render(<JourneyStopCard stop={stop} status="visited" onPress={onPress} />)

    fireEvent.click(screen.getByRole('button'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
