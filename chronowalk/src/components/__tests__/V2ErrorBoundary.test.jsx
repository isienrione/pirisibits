import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import V2ErrorBoundary from '../V2ErrorBoundary.jsx'

const recoverStaleClient = vi.fn(async () => ({ recovered: true, reloading: true }))

vi.mock('../../pwa/staleChunkRecovery.js', () => ({
  recoverStaleClient: (...args) => recoverStaleClient(...args),
}))

function BrokenChild() {
  throw new Error('boom')
}

describe('V2ErrorBoundary', () => {
  beforeEach(() => {
    recoverStaleClient.mockClear()
  })

  it('renders fallback UI and custom onRetry still remounts', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const onRetry = vi.fn()

    const { rerender } = render(
      <V2ErrorBoundary title="Journey error" onRetry={onRetry}>
        <BrokenChild />
      </V2ErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Journey error')).toBeInTheDocument()

    rerender(
      <V2ErrorBoundary title="Journey error" onRetry={onRetry}>
        <p>Recovered</p>
      </V2ErrorBoundary>,
    )

    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    await waitFor(() => expect(onRetry).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(screen.getByText('Recovered')).toBeInTheDocument())
    expect(recoverStaleClient).not.toHaveBeenCalled()

    consoleError.mockRestore()
  })

  it('Try again performs real stale-client recovery by default', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <V2ErrorBoundary title="Tour unavailable">
        <BrokenChild />
      </V2ErrorBoundary>,
    )

    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    await waitFor(() => expect(recoverStaleClient).toHaveBeenCalledWith({ force: true }))

    consoleError.mockRestore()
  })
})
