import { describe, expect, it } from 'vitest'
import {
  easeThresholdProgress,
  revealToClipRight,
  revealToSeamPercent,
} from '../thresholdReveal'

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

  it('keeps hold wipe linear so early progress is not ease-out jumped', () => {
    expect(easeThresholdProgress(0.2, 'linear')).toBeCloseTo(0.2)
    expect(easeThresholdProgress(0.2, 'easeOut')).toBeGreaterThan(0.4)
  })
})
