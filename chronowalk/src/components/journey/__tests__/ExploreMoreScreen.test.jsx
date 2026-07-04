import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import ExploreMoreScreen from '../ExploreMoreScreen'
import { getExploreMoreContent } from '../../../content/launchExploreMore'

describe('ExploreMoreScreen', () => {
  const content = getExploreMoreContent()

  it('renders large aspirational journey photography with minimal copy', () => {
    render(
      <ExploreMoreScreen
        title={content.title}
        subtitle={content.subtitle}
        journeys={content.journeys}
        onBack={vi.fn()}
        onReturnHome={vi.fn()}
      />
    )

    expect(screen.getByTestId('explore-more-screen')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /explore more/i })).toBeInTheDocument()
    expect(screen.getByTestId('explore-journey-florence')).toBeInTheDocument()
    expect(screen.getByTestId('explore-journey-pompeii')).toBeInTheDocument()
    expect(screen.getByTestId('explore-journey-athens')).toBeInTheDocument()
    expect(screen.getByTestId('explore-journey-paris')).toBeInTheDocument()
    expect(screen.queryByText(/places/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /florence/i })).not.toBeInTheDocument()
  })

  it('returns to the passport and home', () => {
    const onBack = vi.fn()
    const onReturnHome = vi.fn()

    render(
      <ExploreMoreScreen
        title={content.title}
        subtitle={content.subtitle}
        journeys={content.journeys}
        onBack={onBack}
        onReturnHome={onReturnHome}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /back to your passport/i }))
    expect(onBack).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: /return home/i }))
    expect(onReturnHome).toHaveBeenCalledTimes(1)
  })
})
