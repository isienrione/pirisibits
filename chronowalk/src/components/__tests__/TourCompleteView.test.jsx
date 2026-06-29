import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TourCompleteView from '../TourCompleteView'

vi.mock('../ShareCard', () => ({
  default: ({ open, panelTitle }) => (open ? <div data-testid="share-card">{panelTitle}</div> : null),
}))

const tour = {
  id: 'rome-core',
  title: 'Heart of Ancient Rome',
  stopIds: ['colosseum', 'pantheon'],
}

const shareWaypoint = {
  id: 'colosseum',
  title: 'The Colosseum',
  media_cache_version: 1,
  modern_poster_url: '/waypoints/colosseum/exterior/modern-poster.jpg',
  ancient_poster_url: '/waypoints/colosseum/exterior/ancient-poster.jpg',
  modern_video_url: '/waypoints/colosseum/exterior/modern.mp4',
  ancient_video_url: '/waypoints/colosseum/exterior/ancient-reconstruction.mp4',
}

describe('TourCompleteView', () => {
  it('renders completion stats and actions', () => {
    const onViewSummary = vi.fn()
    render(
      <TourCompleteView
        tour={tour}
        visitedCount={2}
        walkedMeters={1200}
        startedAtMs={Date.now() - 45 * 60 * 1000}
        shareWaypoint={shareWaypoint}
        onViewSummary={onViewSummary}
        onDismiss={vi.fn()}
      />
    )

    expect(screen.getByText(/journey complete/i)).toBeInTheDocument()
    expect(screen.getByText('2/2')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /view summary/i }))
    expect(onViewSummary).toHaveBeenCalledTimes(1)
  })

  it('opens the journey share card from the primary action', () => {
    render(
      <TourCompleteView
        tour={tour}
        visitedCount={2}
        walkedMeters={1200}
        startedAtMs={Date.now() - 45 * 60 * 1000}
        shareWaypoint={shareWaypoint}
        onViewSummary={vi.fn()}
        onDismiss={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /share your journey/i }))
    expect(screen.getByTestId('share-card')).toHaveTextContent('Share your journey')
  })
})
