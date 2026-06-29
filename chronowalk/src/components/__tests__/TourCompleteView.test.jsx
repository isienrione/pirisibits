import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TourCompleteView from '../TourCompleteView'
import * as appPreferences from '../../utils/appPreferences'

vi.mock('../ShareCard', () => ({
  default: ({ open, panelTitle }) => (open ? <div data-testid="share-card">{panelTitle}</div> : null),
}))

vi.mock('../../config/env', () => ({
  env: {
    reviewUrl: 'https://apps.apple.com/app/review',
    feedbackUrl: 'mailto:feedback@example.com',
  },
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

const baseProps = {
  tour,
  visitedCount: 2,
  walkedMeters: 1200,
  startedAtMs: Date.now() - 45 * 60 * 1000,
  shareWaypoint,
  onViewSummary: vi.fn(),
  onDismiss: vi.fn(),
}

describe('TourCompleteView', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('renders completion stats and actions', () => {
    const onViewSummary = vi.fn()
    render(
      <TourCompleteView
        {...baseProps}
        onViewSummary={onViewSummary}
      />
    )

    expect(screen.getByText(/journey complete/i)).toBeInTheDocument()
    expect(screen.getByText('2/2')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /view summary/i }))
    expect(onViewSummary).toHaveBeenCalledTimes(1)
  })

  it('opens the journey share card from the primary action', () => {
    render(<TourCompleteView {...baseProps} />)

    fireEvent.click(screen.getByRole('button', { name: /share your journey/i }))
    expect(screen.getByTestId('share-card')).toHaveTextContent('Share your journey')
  })

  it('shows the review prompt only until the user responds', () => {
    const writeReviewPrompted = vi.spyOn(appPreferences, 'writeReviewPrompted')
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

    const { unmount } = render(<TourCompleteView {...baseProps} />)

    expect(screen.getByText(/enjoying chronowalk/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /leave a review/i }))
    expect(writeReviewPrompted).toHaveBeenCalledWith(true)
    expect(openSpy).toHaveBeenCalledWith(
      'https://apps.apple.com/app/review',
      '_blank',
      'noopener,noreferrer'
    )
    expect(screen.queryByText(/enjoying chronowalk/i)).not.toBeInTheDocument()

    unmount()
    vi.spyOn(appPreferences, 'readReviewPrompted').mockReturnValue(true)
    render(<TourCompleteView {...baseProps} />)
    expect(screen.queryByText(/enjoying chronowalk/i)).not.toBeInTheDocument()
  })
})
