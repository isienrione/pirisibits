import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import AppEntryPrepare from '../AppEntryPrepare.jsx'

describe('AppEntryPrepare', () => {
  it('offers offline download, home-screen install, and analytics opt-in', () => {
    const onAnalyticsChange = vi.fn()
    const onInstall = vi.fn()
    render(
      <AppEntryPrepare
        analyticsEnabled={false}
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
    expect(screen.getByText(/add icon to home screen/i)).toBeInTheDocument()
    expect(screen.getByText(/help improve chronowalk/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('switch', { name: /enable analytics/i }))
    expect(onAnalyticsChange).toHaveBeenCalledWith(true)

    fireEvent.click(screen.getByRole('button', { name: /add icon to home screen/i }))
    expect(screen.getByTestId('a2hs-capsule')).toHaveClass('cw-a2hs-capsule--open')
    expect(screen.getByTestId('a2hs-howto-demo-ios')).toBeInTheDocument()
    expect(screen.getByText(/iphone — use safari only/i)).toBeInTheDocument()
    expect(screen.getByTestId('a2hs-ios-chrome-warning')).toBeInTheDocument()
  })

  it('shows installed state when already on the home screen', () => {
    render(<AppEntryPrepare installed onContinue={vi.fn()} />)
    expect(screen.getByTestId('a2hs-option-installed')).toBeInTheDocument()
    expect(screen.getByText(/on your home screen/i)).toBeInTheDocument()
  })
})
