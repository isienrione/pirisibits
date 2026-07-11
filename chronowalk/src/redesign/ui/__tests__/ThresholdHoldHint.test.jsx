import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ThresholdHoldHint from '../ThresholdHoldHint.jsx'

describe('ThresholdHoldHint', () => {
  it('renders a pulsing hold affordance', () => {
    render(<ThresholdHoldHint label="Hold to reveal" />)

    expect(screen.getByTestId('threshold-hold-hint')).toBeInTheDocument()
    expect(screen.getByText('Hold to reveal')).toBeInTheDocument()
  })
})
