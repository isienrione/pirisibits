import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import JourneyArrivedScreen from '../JourneyArrivedScreen.jsx'

vi.mock('../../../../hooks/useActAccent.js', () => ({
  useActAccent: () => 'var(--act-forum)',
}))

describe('JourneyArrivedScreen', () => {
  it('renders obsidian arrival with act-accent eyebrow and ember seam', () => {
    const { container } = render(
      <JourneyArrivedScreen
        waypoint={{
          id: 'w06',
          title: 'Basilica of Maxentius',
          arrival_subtitle: 'Nine vaults still hold the sky.',
        }}
      />
    )

    expect(screen.getByText(/act III · The Forum/i)).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /basilica of maxentius/i })
    ).toBeInTheDocument()
    expect(screen.getByText(/nine vaults still hold the sky/i)).toBeInTheDocument()
    expect(container.querySelector('.bg-obsidian')).toBeTruthy()
    expect(container.querySelector('.animate-living-seam')).toBeTruthy()
  })
})
