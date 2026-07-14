import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ThresholdRevealInvite, { eraPhraseForInvite } from '../ThresholdRevealInvite.jsx'

describe('ThresholdRevealInvite', () => {
  it('formats era phrase for headline copy', () => {
    expect(eraPhraseForInvite('ANCIENT ROME')).toBe('the time of Ancient Rome')
    expect(eraPhraseForInvite('IMPERIAL ROME')).toMatch(/era of/i)
  })

  it('renders animated invite with threshold headline', () => {
    render(<ThresholdRevealInvite thenLabel="ANCIENT ROME" />)
    expect(screen.getByTestId('reveal-invite')).toBeInTheDocument()
    expect(screen.getByText(/are you ready to see how this would have looked/i)).toBeInTheDocument()
    expect(screen.getByText(/hold anywhere on the image/i)).toBeInTheDocument()
    expect(screen.getByText(/hold to unlock history/i)).toBeInTheDocument()
  })

  it('shows a close control in interactive mode', () => {
    const onDismiss = vi.fn()
    render(
      <ThresholdRevealInvite thenLabel="ANCIENT ROME" interactive onDismiss={onDismiss} />
    )
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})
