import { describe, expect, it } from 'vitest'
import {
  JOURNEY_PACE,
  PACE_OPTIONS,
  ROME_ACTS,
  getActForWaypoint,
  getDefaultPace,
  getPaceOption,
} from '../romePacing'

describe('romePacing', () => {
  it('defines four tour tiers with Roma central as default', () => {
    expect(PACE_OPTIONS).toHaveLength(4)
    expect(PACE_OPTIONS[0]).toMatchObject({
      id: JOURNEY_PACE.CENTRAL,
      title: 'Roma central',
      priceLabel: '$12',
    })
    expect(getDefaultPace()).toBe(JOURNEY_PACE.CENTRAL)
    expect(getPaceOption(JOURNEY_PACE.CLASSIC).title).toBe('Roma antica')
    expect(getPaceOption(JOURNEY_PACE.HEROIC).title).toBe('Roma eterna')
    expect(getPaceOption(JOURNEY_PACE.OWN).priceLabel).toBe('$17.99')
  })

  it('maps waypoints to six acts plus encore', () => {
    expect(ROME_ACTS).toHaveLength(7)
    expect(getActForWaypoint('w01')?.title).toBe('The Arena')
    expect(getActForWaypoint('w15')?.title).toBe('The Living City')
    expect(getActForWaypoint('w22')?.title).toBe('The Long Road')
  })
})
