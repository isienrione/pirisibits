import { describe, expect, it, beforeEach } from 'vitest'
import {
  hasSeenThresholdRevealTutorial,
  markThresholdRevealTutorialSeen,
} from '../thresholdWaypointReveal.js'

describe('thresholdWaypointReveal', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('tracks the threshold tutorial once globally', () => {
    expect(hasSeenThresholdRevealTutorial()).toBe(false)

    markThresholdRevealTutorialSeen()

    expect(hasSeenThresholdRevealTutorial()).toBe(true)
  })
})
