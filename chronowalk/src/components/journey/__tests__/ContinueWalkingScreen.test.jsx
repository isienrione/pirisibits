import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import ContinueWalkingScreen from '../ContinueWalkingScreen'

const destination = {
  id: 'palatine-hill-cluster',
  title: 'Palatine Hill',
  shortTitle: 'Palatine Hill',
  heroImage: '/waypoints/palatine/hero.jpg',
}

describe('ContinueWalkingScreen', () => {
  it('renders the next destination in explorer mode', () => {
    render(
      <ContinueWalkingScreen
        destination={destination}
        heroImage={destination.heroImage}
        distanceMeters={640}
        stopNumber={1}
        totalStops={9}
        onContinue={vi.fn()}
      />
    )

    expect(screen.getByTestId('continue-walking-screen')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /palatine hill/i })).toBeInTheDocument()
    expect(screen.getByText(/journey progress/i)).toBeInTheDocument()
    expect(screen.getByText('1 of 9')).toBeInTheDocument()
    expect(screen.getByText(/640 m/i)).toBeInTheDocument()
    expect(screen.getByText(/min walk/i)).toBeInTheDocument()
  })

  it('continues on primary action', () => {
    const onContinue = vi.fn()

    render(
      <ContinueWalkingScreen
        destination={destination}
        heroImage={destination.heroImage}
        distanceMeters={640}
        stopNumber={1}
        totalStops={9}
        onContinue={onContinue}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /^continue$/i }))
    expect(onContinue).toHaveBeenCalledTimes(1)
  })

  it('renders tour completion state on the final stop', () => {
    render(
      <ContinueWalkingScreen
        destination={destination}
        heroImage={destination.heroImage}
        distanceMeters={null}
        stopNumber={9}
        totalStops={9}
        isLastStop
        onContinue={vi.fn()}
      />
    )

    expect(screen.getByRole('heading', { level: 1, name: /tour complete/i })).toBeInTheDocument()
    expect(screen.getByText('9 of 9')).toBeInTheDocument()
  })
})
