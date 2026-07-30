import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import V2ErrorBoundary from '../V2ErrorBoundary.jsx'

const recoverStaleClient = vi.fn(async () => ({ recovered: true, reloading: true }))

vi.mock('../../pwa/staleChunkRecovery.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    recoverStaleClient: (...args) => recoverStaleClient(...args),
  }
})

function BrokenChild() {
  throw new Error('boom')
}

describe('V2ErrorBoundary', () => {
  beforeEach(() => {
    recoverStaleClient.mockClear()
    recoverStaleClient.mockResolvedValue({ recovered: true, reloading: true })
  })

  it('renders fallback UI and custom onRetry still remounts', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const onRetry = vi.fn()
    // Don't auto-recover in this test — custom onRetry owns the path.
    recoverStaleClient.mockResolvedValue({ recovered: false, reloading: false })

    const { rerender } = render(
      <V2ErrorBoundary title="Journey error" onRetry={onRetry} autoRecoverOnAnyError={false}>
        <BrokenChild />
      </V2ErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Journey error')).toBeInTheDocument()

    rerender(
      <V2ErrorBoundary title="Journey error" onRetry={onRetry} autoRecoverOnAnyError={false}>
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
    recoverStaleClient.mockResolvedValue({ recovered: false, reloading: false })

    render(
      <V2ErrorBoundary title="Couldn’t load ChronoWalk" autoRecoverOnAnyError={false}>
        <BrokenChild />
      </V2ErrorBoundary>,
    )

    expect(screen.getByRole('link', { name: /refresh the app shell/i })).toHaveAttribute(
      'href',
      '/rome/reset-shell.html',
    )

    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    await waitFor(() =>
      expect(recoverStaleClient).toHaveBeenCalledWith({ force: true, reason: 'manual-retry' }),
    )

    consoleError.mockRestore()
  })

  it('auto-recovers when a stale chunk error is caught', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    function StaleChunkChild() {
      throw new Error('Failed to fetch dynamically imported module: https://example/assets/x.js')
    }

    render(
      <V2ErrorBoundary title="Couldn’t load ChronoWalk">
        <StaleChunkChild />
      </V2ErrorBoundary>,
    )

    expect(screen.getByText(/Updating ChronoWalk/i)).toBeInTheDocument()
    await waitFor(() => expect(recoverStaleClient).toHaveBeenCalled())

    consoleError.mockRestore()
  })

  it('does not auto-recover generic errors (avoids landing loop)', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <V2ErrorBoundary title="Couldn’t load ChronoWalk">
        <BrokenChild />
      </V2ErrorBoundary>,
    )

    expect(screen.getByText('Couldn’t load ChronoWalk')).toBeInTheDocument()
    expect(screen.queryByText(/Updating ChronoWalk/i)).not.toBeInTheDocument()
    await waitFor(() => expect(recoverStaleClient).not.toHaveBeenCalled())

    consoleError.mockRestore()
  })
})
