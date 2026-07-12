import { describe, expect, it } from 'vitest'
import {
  getClassicDayBreakWaypointId,
  shouldClassicDayBreak,
} from '../actBoundaries.js'
import { JOURNEY_PACE } from '../../data/romePacing.js'

describe('actBoundaries', () => {
  it('identifies the last act IV waypoint as the classic day break', () => {
    expect(getClassicDayBreakWaypointId()).toBe('w14')
    expect(shouldClassicDayBreak(JOURNEY_PACE.CLASSIC, 'w14')).toBe(true)
    expect(shouldClassicDayBreak(JOURNEY_PACE.HEROIC, 'w14')).toBe(false)
    expect(shouldClassicDayBreak(JOURNEY_PACE.CLASSIC, 'w15')).toBe(false)
  })
})
