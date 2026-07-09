import { describe, expect, it, beforeEach } from 'vitest'
import {
  hasSeenWaypointRevealInvite,
  markWaypointRevealInviteSeen,
} from '../thresholdWaypointReveal.js'

describe('thresholdWaypointReveal', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('tracks reveal invite per waypoint', () => {
    expect(hasSeenWaypointRevealInvite('w01')).toBe(false)

    markWaypointRevealInviteSeen('w01')

    expect(hasSeenWaypointRevealInvite('w01')).toBe(true)
    expect(hasSeenWaypointRevealInvite('w02')).toBe(false)
  })
})
