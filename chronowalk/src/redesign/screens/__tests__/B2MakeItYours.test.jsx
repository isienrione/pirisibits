import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import B2MakeItYours from '../B2MakeItYours.jsx'

describe('B2MakeItYours analytics row', () => {
  it('offers analytics opt-in with privacy copy', () => {
    const onAnalyticsChange = vi.fn()
    render(
      <B2MakeItYours
        canInstall={false}
        analyticsEnabled={false}
        onAnalyticsChange={onAnalyticsChange}
        onContinue={vi.fn()}
      />,
    )

    expect(screen.getByText(/three small things before rome/i)).toBeInTheDocument()
    expect(screen.getByText(/help improve chronowalk/i)).toBeInTheDocument()
    expect(screen.getByText(/never sell your data/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('switch', { name: /enable analytics/i }))
    expect(onAnalyticsChange).toHaveBeenCalledWith(true)
  })

  it('shows numbered Share → Add steps on iOS Safari', () => {
    render(
      <B2MakeItYours
        showIosInstructions
        canInstall
        onInstall={vi.fn()}
        onContinue={vi.fn()}
      />,
    )

    expect(screen.getByText(/tap/i)).toBeInTheDocument()
    expect(screen.getByText(/share/i)).toBeInTheDocument()
    expect(screen.getByText(/add to home screen/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /i've added it/i })).toBeInTheDocument()
  })

  it('tells non-Safari iOS browsers to open Safari', () => {
    render(
      <B2MakeItYours
        showIosInstructions
        needsSafariForInstall
        canInstall
        onInstall={vi.fn()}
        onContinue={vi.fn()}
      />,
    )

    expect(screen.getByText(/open this page in/i)).toBeInTheDocument()
  })
})
