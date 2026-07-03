import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ArrivalCard } from '../ArrivalCard'

describe('ArrivalCard', () => {
  it('renders act eyebrow and waypoint name without box chrome', () => {
    const { container } = render(
      <ArrivalCard
        actEyebrow="Act III · The Forum"
        waypointName="Basilica of Maxentius"
        eyebrowAccent="var(--act-forum)"
      />
    )

    expect(screen.getByText('Act III · The Forum')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /basilica of maxentius/i })).toBeInTheDocument()
    expect(container.querySelector('.animate-living-seam')).toBeTruthy()
    expect(container.querySelector('[class*="border"]')).toBeNull()
    expect(container.querySelector('[class*="shadow"]')).toBeNull()
  })
})
