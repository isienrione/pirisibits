import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import V2ErrorBoundary from '../V2ErrorBoundary.jsx'

function BrokenChild() {
  throw new Error('boom')
}

describe('V2ErrorBoundary', () => {
  it('renders fallback UI and retries', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { rerender } = render(
      <V2ErrorBoundary title="Journey error">
        <BrokenChild />
      </V2ErrorBoundary>
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Journey error')).toBeInTheDocument()

    rerender(
      <V2ErrorBoundary title="Journey error">
        <p>Recovered</p>
      </V2ErrorBoundary>
    )

    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(screen.getByText('Recovered')).toBeInTheDocument()

    consoleError.mockRestore()
  })
})
