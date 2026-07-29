import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ThresholdDiegeticHint, { formatThenHintLabel } from '../ThresholdDiegeticHint.jsx'

describe('ThresholdDiegeticHint', () => {
  it('formats then labels for the single instruction line', () => {
    expect(formatThenHintLabel('ANCIENT ROME')).toBe('Ancient Rome')
    expect(formatThenHintLabel('imperial rome')).toBe('Imperial Rome')
  })

  it('renders ring + one line — not a triple-instruction card', () => {
    render(<ThresholdDiegeticHint thenLabel="ANCIENT ROME" showText />)
    expect(screen.getByTestId('threshold-diegetic-hint')).toBeInTheDocument()
    expect(screen.getByText(/hold to reveal ancient rome/i)).toBeInTheDocument()
    expect(screen.getByTestId('threshold-diegetic-finger')).toBeInTheDocument()
    expect(screen.queryByText(/cross into the past/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/are you ready/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/press & hold to cross the threshold/i)).not.toBeInTheDocument()
  })

  it('keeps the pointing hand on brief ring-only nudges (no text)', () => {
    render(<ThresholdDiegeticHint thenLabel="ANCIENT ROME" showText={false} />)
    expect(screen.getByTestId('threshold-diegetic-hint')).toBeInTheDocument()
    expect(screen.queryByText(/hold to reveal/i)).not.toBeInTheDocument()
    expect(screen.getByTestId('threshold-diegetic-finger')).toBeInTheDocument()
  })
})
