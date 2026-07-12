import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import AudioInterruptionBanner from '../AudioInterruptionBanner.jsx'

describe('AudioInterruptionBanner', () => {
  it('renders resume prompt and calls onResume', () => {
    const onResume = vi.fn()

    render(<AudioInterruptionBanner onResume={onResume} />)

    const button = screen.getByRole('button', { name: /sound was interrupted/i })
    fireEvent.click(button)
    expect(onResume).toHaveBeenCalledTimes(1)
  })
})
