import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import AppEntryPrepare from '../AppEntryPrepare.jsx'

describe('AppEntryPrepare', () => {
  it('offers offline download and analytics opt-in inside the app', () => {
    const onAnalyticsChange = vi.fn()
    render(
      <AppEntryPrepare
        analyticsEnabled={false}
        onAnalyticsChange={onAnalyticsChange}
        onContinue={vi.fn()}
      />,
    )

    expect(screen.getByTestId('app-entry-prepare')).toBeInTheDocument()
    expect(screen.getByText(/inside chronowalk/i)).toBeInTheDocument()
    expect(screen.getByText(/prepare for the streets/i)).toBeInTheDocument()
    expect(screen.getByText(/help improve chronowalk/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('switch', { name: /enable analytics/i }))
    expect(onAnalyticsChange).toHaveBeenCalledWith(true)
  })
})
