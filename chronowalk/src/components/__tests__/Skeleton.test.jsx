import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { SkeletonWaypointCard, RouteLoadingShimmer } from '../ui/Skeleton'

describe('Skeleton', () => {
  it('renders a waypoint card skeleton with busy status', () => {
    const { container } = render(<SkeletonWaypointCard />)

    expect(container.querySelector('[aria-busy="true"]')).toBeTruthy()
  })

  it('renders route loading shimmer steps', () => {
    const { container } = render(<RouteLoadingShimmer />)

    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0)
  })
})
