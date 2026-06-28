import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import OfflineBadge from '../OfflineBadge'

describe('OfflineBadge', () => {
  it('renders a subtle offline status badge', () => {
    render(<OfflineBadge />)

    expect(screen.getByRole('status', { name: /offline/i })).toBeInTheDocument()
    expect(screen.getByText('Offline')).toBeInTheDocument()
  })
})
