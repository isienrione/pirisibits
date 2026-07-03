import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import JourneyLetter from '../JourneyLetter.jsx'
import ThresholdBloom from '../ThresholdBloom.jsx'

describe('JourneyLetter', () => {
  it('renders obsidian letter with route draw and stats', () => {
    render(<JourneyLetter />)

    expect(screen.getByRole('heading', { name: /the path you walked/i })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /route through completed acts/i })).toBeInTheDocument()
    expect(screen.getByText(/landmarks heard/i)).toBeInTheDocument()
    expect(screen.getByText(/rome keeps its echoes/i)).toBeInTheDocument()
  })
})

describe('ThresholdBloom', () => {
  it('fires once when active and calls onComplete', () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()

    const { rerender } = render(<ThresholdBloom active={false} onComplete={onComplete} />)
    expect(document.querySelector('[aria-hidden="true"]')).toBeNull()

    rerender(<ThresholdBloom active onComplete={onComplete} />)
    expect(document.querySelector('[aria-hidden="true"]')).toBeTruthy()

    vi.advanceTimersByTime(600)
    expect(onComplete).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })
})
