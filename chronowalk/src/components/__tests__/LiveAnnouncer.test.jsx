import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import LiveAnnouncer from '../LiveAnnouncer'

describe('LiveAnnouncer', () => {
  it('renders a polite live region for screen readers', () => {
    render(<LiveAnnouncer message="Waypoint discovered: Colosseum." />)

    const region = screen.getByRole('status')
    expect(region).toHaveAttribute('aria-live', 'polite')
    expect(region).toHaveClass('sr-only')
  })
})
