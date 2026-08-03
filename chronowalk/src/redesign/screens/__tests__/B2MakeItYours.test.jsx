import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import AppEntryPrepare from '../AppEntryPrepare.jsx'

describe('AppEntryPrepare', () => {
  it('offers offline download and home-screen install', () => {
    const onInstall = vi.fn()
    render(
      <AppEntryPrepare
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
    const a2hs = screen.getByTestId('app-entry-a2hs')
    const download = screen.getByTestId('app-entry-download')
    expect(a2hs.compareDocumentPosition(download) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.queryByText(/help improve chronowalk/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('switch', { name: /analytics/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /use as a mobile app/i }))
    expect(screen.getByTestId('a2hs-capsule')).toHaveClass('cw-a2hs-capsule--open')
    expect(screen.getByTestId('a2hs-howto-demo-ios')).toBeInTheDocument()
    expect(screen.getAllByText(/iphone - safari or chrome/i).length).toBeGreaterThan(0)
    expect(screen.getByTestId('a2hs-ios-inapp-warning')).toBeInTheDocument()
  })

  it('shows installed state when already on the home screen', () => {
    render(<AppEntryPrepare installed onContinue={vi.fn()} />)
    const card = screen.getByTestId('app-entry-a2hs')
    expect(card).toHaveAttribute('data-installed', 'true')
    expect(within(card).getByText(/^Done$/i)).toBeInTheDocument()
    expect(screen.getByTestId('a2hs-option-installed')).toBeInTheDocument()
    expect(screen.getByText(/ready as a mobile app/i)).toBeInTheDocument()
    expect(screen.getByText(/you're already using chronowalk from your home screen/i)).toBeInTheDocument()
    expect(within(card).queryByText(/^Recommended$/i)).not.toBeInTheDocument()
  })

  it('keeps Recommended install copy when opened from the browser', () => {
    render(<AppEntryPrepare onContinue={vi.fn()} showIosInstructions />)
    const card = screen.getByTestId('app-entry-a2hs')
    expect(card).toHaveAttribute('data-installed', 'false')
    expect(within(card).getByText(/^Recommended$/i)).toBeInTheDocument()
    expect(screen.getByText(/use as a mobile app/i)).toBeInTheDocument()
    expect(screen.queryByTestId('a2hs-option-installed')).not.toBeInTheDocument()
  })
})
