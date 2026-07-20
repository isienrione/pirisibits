import { describe, expect, it, beforeEach } from 'vitest'
import { hasSeenThresholdHint, markThresholdHintSeen } from '../thresholdHint'

describe('thresholdHint', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows hint until first successful crossing', () => {
    expect(hasSeenThresholdHint()).toBe(false)
    markThresholdHintSeen()
    expect(hasSeenThresholdHint()).toBe(true)
  })
})
