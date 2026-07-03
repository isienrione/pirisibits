import { describe, expect, it } from 'vitest'
import {
  JOURNEY_PACE,
  PACE_OPTIONS,
  ROME_ACTS,
  getActForWaypoint,
  getPaceOption,
} from '../romePacing'

describe('romePacing', () => {
  it('defines three pace options with classic as default', () => {
    expect(PACE_OPTIONS).toHaveLength(3)
    expect(PACE_OPTIONS[0]).toMatchObject({
      id: JOURNEY_PACE.CLASSIC,
      badge: 'Most loved',
    })
    expect(getPaceOption(JOURNEY_PACE.HEROIC).title).toBe('The Heroic Day')
  })

  it('maps waypoints to six acts plus encore', () => {
    expect(ROME_ACTS).toHaveLength(7)
    expect(getActForWaypoint('w01')?.title).toBe('The Arena')
    expect(getActForWaypoint('w15')?.title).toBe('The Living City')
    expect(getActForWaypoint('w22')?.title).toBe('The Long Games & the Long Road')
    expect(getActForWaypoint('enc_circus')?.id).toBe('encore')
  })
})
