import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from '../ui/EmptyState'

describe('EmptyState', () => {
  it('renders preset copy with a primary action', () => {
    const onAction = vi.fn()
    render(<EmptyState preset="noInternet" onAction={onAction} />)

    expect(screen.getByText(/you appear to be offline/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('supports compact mode without the long body', () => {
    render(<EmptyState preset="gpsWaiting" compact />)

    expect(screen.getByText(/finding your location/i)).toBeInTheDocument()
    expect(screen.queryByText(/waiting for a gps fix/i)).not.toBeInTheDocument()
  })
})
