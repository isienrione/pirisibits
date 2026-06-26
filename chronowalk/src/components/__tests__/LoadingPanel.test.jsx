import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoadingPanel } from '../ui/LoadingPanel'

describe('LoadingPanel', () => {
  it('renders an accessible loading status', () => {
    render(<LoadingPanel label="Loading map…" hint="One moment" />)

    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Loading map…')).toBeInTheDocument()
    expect(screen.getByText('One moment')).toBeInTheDocument()
  })
})
