import { describe, expect, it, beforeEach } from 'vitest'
import {
  CROSSED_KEY,
  hasCrossedThreshold,
  hasCrossedThresholdAtWaypoint,
  markThresholdCrossed,
  markThresholdCrossedAtWaypoint,
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

  it('tracks threshold crosses per waypoint for later stops on path B', () => {
    markThresholdCrossedAtWaypoint('w04')
    expect(hasCrossedThreshold()).toBe(true)
    expect(hasCrossedThresholdAtWaypoint('w04')).toBe(true)
    expect(hasCrossedThresholdAtWaypoint('w03')).toBe(false)
    markThresholdCrossedAtWaypoint('w03')
    expect(hasCrossedThresholdAtWaypoint('w03')).toBe(true)
  })
})
