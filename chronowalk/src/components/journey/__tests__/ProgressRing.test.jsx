import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProgressRing } from '../ProgressRing'

vi.mock('../../../hooks/useReducedMotion', () => ({
  useReducedMotion: () => true,
}))

describe('ProgressRing', () => {
  it('renders completion percentage', () => {
    render(<ProgressRing value={67} label="Complete" />)

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '67')
    expect(screen.getByText('67%')).toBeInTheDocument()
    expect(screen.getByText('Complete')).toBeInTheDocument()
  })
})
