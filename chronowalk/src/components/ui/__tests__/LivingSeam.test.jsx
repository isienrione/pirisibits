import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { LivingSeam } from '../LivingSeam'

describe('LivingSeam', () => {
  it('renders a vertical breathing ember hairline with seam glow', () => {
    const { container } = render(<LivingSeam />)
    const seam = container.firstChild

    expect(seam).toHaveAttribute('aria-hidden', 'true')
    expect(seam).toHaveClass('animate-living-seam', 'bg-ember', 'w-[1.5px]')
    expect(seam).toHaveStyle({ boxShadow: 'var(--seam-glow)' })
  })

  it('renders horizontal when vertical is false', () => {
    const { container } = render(<LivingSeam vertical={false} />)
    const seam = container.firstChild

    expect(seam).toHaveClass('h-[1.5px]', 'w-full')
  })
})
