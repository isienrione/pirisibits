import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PreTourFlow } from '../PreTourFlow'
import { PRE_TOUR_SCREENS } from '../preTourConfig'

describe('PreTourFlow', () => {
  it('can open PWA install as its own screen', () => {
    render(
      <PreTourFlow
        ownedTourIds={[]}
        ownsAllTours={false}
        onPurchaseProduct={vi.fn()}
        onStartTour={vi.fn()}
        onTryFreePreview={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /add to home screen/i }))
    expect(screen.getByRole('heading', { name: /walk with chronowalk offline-ready/i })).toBeInTheDocument()
    expect(screen.getAllByText(/add chronowalk to your home screen/i).length).toBeGreaterThan(0)
  })

  it('renders cinematic begin journey outside the light pre-tour shell', () => {
    render(
      <PreTourFlow
        ownedTourIds={['heart-of-ancient-rome']}
        ownsAllTours={false}
        onPurchaseProduct={vi.fn()}
        onStartTour={vi.fn()}
        onTryFreePreview={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /continue with heart of ancient rome/i }))

    expect(screen.getByRole('button', { name: /start tour/i })).toBeInTheDocument()
    expect(screen.getByText('Visual reveals')).toBeInTheDocument()
    expect(screen.queryByText(/walk the city on your own schedule/i)).not.toBeInTheDocument()
  })
})

describe('preTourConfig', () => {
  it('exports screen ids', () => {
    expect(PRE_TOUR_SCREENS.WELCOME).toBe('welcome')
    expect(PRE_TOUR_SCREENS.PERMISSIONS).toBe('permissions')
  })
})
