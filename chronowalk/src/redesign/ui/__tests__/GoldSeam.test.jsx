import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GoldSeam } from '../GoldSeam.jsx'
import { GOLD_SEAM_MOMENTS, resolveGoldSeamPreset } from '../goldSeamPresets.js'

describe('goldSeamPresets', () => {
  it('defines every required meaningful moment', () => {
    const required = [
      'loading',
      'chapterTransition',
      'arrival',
      'gpsAcquired',
      'purchaseSuccess',
      'tourUnlocked',
      'audioUnlocked',
      'actTransition',
    ]
    for (const key of required) {
      expect(GOLD_SEAM_MOMENTS[key]).toBeTruthy()
      expect(GOLD_SEAM_MOMENTS[key].variant).toBeTruthy()
      expect(GOLD_SEAM_MOMENTS[key].motion).toBeTruthy()
    }
  })

  it('resolves unknown moments to a safe default', () => {
    const preset = resolveGoldSeamPreset('not-a-real-moment')
    expect(preset.variant).toBe('vertical')
    expect(preset.motion).toBe('breathe')
  })
})

describe('GoldSeam', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders a moment with semantic test id', () => {
    render(<GoldSeam moment="arrival" />)
    expect(screen.getByTestId('gold-seam-arrival')).toBeInTheDocument()
    expect(screen.getByTestId('gold-seam-arrival')).toHaveAttribute('data-gold-seam', 'arrival')
  })

  it('fires onComplete once for non-looping motion', () => {
    const onComplete = vi.fn()
    render(<GoldSeam moment="gpsAcquired" onComplete={onComplete} />)
    expect(onComplete).not.toHaveBeenCalled()
    vi.advanceTimersByTime(900)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('does not fire onComplete when looping', () => {
    const onComplete = vi.fn()
    render(<GoldSeam moment="loading" onComplete={onComplete} />)
    vi.advanceTimersByTime(10_000)
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('accepts low-level overrides over the preset', () => {
    render(<GoldSeam moment="arrival" length={40} glow={false} />)
    const el = screen.getByTestId('gold-seam-arrival')
    expect(el.style.height).toBe('40px')
  })
})
