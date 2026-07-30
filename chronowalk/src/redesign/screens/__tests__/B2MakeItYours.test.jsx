import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import AppEntryPrepare from '../AppEntryPrepare.jsx'

describe('AppEntryPrepare', () => {
  it('offers offline download, home-screen install, and analytics opt-in', () => {
    const onAnalyticsChange = vi.fn()
    const onInstall = vi.fn()
    render(
      <AppEntryPrepare
        analyticsEnabled
        onAnalyticsChange={onAnalyticsChange}
        onInstall={onInstall}
        onContinue={vi.fn()}
        showIosInstructions
      />,
    )

    expect(screen.getByTestId('app-entry-prepare')).toBeInTheDocument()
    expect(screen.getByText(/inside chronowalk/i)).toBeInTheDocument()
    expect(screen.getByText(/prepare for the streets/i)).toBeInTheDocument()
    expect(screen.getByText(/download the walk/i)).toBeInTheDocument()
    expect(screen.getByText(/use as a mobile app/i)).toBeInTheDocument()
    expect(
      screen.getByText(/add chronowalk to your home screen so you open it like a regular app/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/help improve chronowalk/i)).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: /disable analytics/i })).toHaveAttribute(
      'aria-checked',
      'true',
    )

    fireEvent.click(screen.getByRole('switch', { name: /disable analytics/i }))
    expect(onAnalyticsChange).toHaveBeenCalledWith(false)

    fireEvent.click(screen.getByRole('button', { name: /use as a mobile app/i }))
    expect(screen.getByTestId('a2hs-capsule')).toHaveClass('cw-a2hs-capsule--open')
    expect(screen.getByTestId('a2hs-howto-demo-ios')).toBeInTheDocument()
    expect(screen.getAllByText(/iphone - safari or chrome/i).length).toBeGreaterThan(0)
    expect(screen.getByTestId('a2hs-ios-inapp-warning')).toBeInTheDocument()
  })

  it('shows installed state when already on the home screen', () => {
    render(<AppEntryPrepare installed onContinue={vi.fn()} />)
    expect(screen.getByTestId('a2hs-option-installed')).toBeInTheDocument()
    expect(screen.getByText(/ready as a mobile app/i)).toBeInTheDocument()
  })
})
