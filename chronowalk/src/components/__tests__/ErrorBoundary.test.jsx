import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from '../ErrorBoundary'

function BrokenChild() {
  throw new Error('boom')
}

describe('ErrorBoundary', () => {
  it('renders a recovery UI when a child throws', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary title="Test failure">
        <BrokenChild />
      </ErrorBoundary>
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Test failure')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()

    consoleError.mockRestore()
  })

  it('resets after retry is clicked', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    let shouldThrow = true

    function MaybeBroken() {
      if (shouldThrow) throw new Error('boom')
      return <p>Recovered</p>
    }

    render(
      <ErrorBoundary title="Test failure">
        <MaybeBroken />
      </ErrorBoundary>
    )

    shouldThrow = false
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))

    expect(screen.getByText('Recovered')).toBeInTheDocument()

    consoleError.mockRestore()
  })
})
