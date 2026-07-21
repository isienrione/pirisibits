import { describe, expect, it, beforeEach } from 'vitest'
import {
  CROSSED_KEY,
  hasCrossedThreshold,
  markThresholdCrossed,
  hasSeenThresholdRevealTutorial,
  markThresholdRevealTutorialSeen,
} from '../thresholdWaypointReveal'

describe('thresholdWaypointReveal / hasCrossedThreshold', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts unset and persists after a successful cross', () => {
    expect(hasCrossedThreshold()).toBe(false)
    markThresholdCrossed()
    expect(localStorage.getItem(CROSSED_KEY)).toBe('true')
    expect(hasCrossedThreshold()).toBe(true)
  })

  it('honors legacy tutorial flags so returning travelers are not re-taught', () => {
    localStorage.setItem('cw_threshold_reveal_tutorial_seen', 'true')
    expect(hasCrossedThreshold()).toBe(true)
  })

  it('keeps deprecated aliases working', () => {
    expect(hasSeenThresholdRevealTutorial()).toBe(false)
    markThresholdRevealTutorialSeen()
    expect(hasSeenThresholdRevealTutorial()).toBe(true)
    expect(hasCrossedThreshold()).toBe(true)
  })
})
