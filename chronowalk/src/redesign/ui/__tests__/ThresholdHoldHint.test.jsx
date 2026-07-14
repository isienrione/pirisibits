import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ThresholdHoldHint from '../ThresholdHoldHint.jsx'

describe('ThresholdHoldHint', () => {
  it('renders the signature hold affordance', () => {
    render(<ThresholdHoldHint />)

    expect(screen.getByTestId('threshold-hold-hint')).toBeInTheDocument()
    expect(screen.getByTestId('press-hold-orb')).toBeInTheDocument()
    expect(screen.getByText(/hold to unlock history/i)).toBeInTheDocument()
  })
})
