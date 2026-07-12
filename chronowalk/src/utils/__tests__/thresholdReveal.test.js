import { describe, expect, it } from 'vitest'
import { revealToClipRight, revealToSeamPercent } from '../thresholdReveal'

describe('thresholdReveal', () => {
  it('clips the Now layer from the right as reveal increases', () => {
    expect(revealToClipRight(0)).toBe('inset(0 0% 0 0)')
    expect(revealToClipRight(0.5)).toBe('inset(0 50% 0 0)')
    expect(revealToClipRight(1)).toBe('inset(0 100% 0 0)')
  })

  it('moves the seam from right to left', () => {
    expect(revealToSeamPercent(0)).toBe(100)
    expect(revealToSeamPercent(1)).toBe(0)
  })
})
