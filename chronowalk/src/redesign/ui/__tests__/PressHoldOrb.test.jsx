import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PressHoldOrb } from '../PressHoldOrb.jsx'

describe('PressHoldOrb', () => {
  it('exposes phase and progress for the signature hold', () => {
    render(<PressHoldOrb phase="charging" progress={0.4} />)

    const orb = screen.getByTestId('press-hold-orb')
    expect(orb).toHaveAttribute('data-hold-phase', 'charging')
    expect(orb.style.getPropertyValue('--cw-hold-progress')).toBe('0.4')
    expect(screen.getByText(/unlocking history/i)).toBeInTheDocument()
  })
})
