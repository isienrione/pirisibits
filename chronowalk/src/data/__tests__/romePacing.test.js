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
  it('defines four tour tiers with Roma Eterna as the default', () => {
    expect(PACE_OPTIONS).toHaveLength(4)
    expect(PACE_OPTIONS[0]).toMatchObject({
      id: JOURNEY_PACE.HEROIC,
      title: 'Roma Eterna',
      badge: 'Most loved',
      priceLabel: '$17.99',
    })
    expect(getDefaultPace()).toBe(JOURNEY_PACE.HEROIC)
    expect(getPaceOption(JOURNEY_PACE.CLASSIC).title).toBe('Roma Antica')
    expect(getPaceOption(JOURNEY_PACE.CENTRAL).title).toBe('Roma Centrale')
    expect(getPaceOption(JOURNEY_PACE.OWN).priceLabel).toBe('$17.99')
  })

  it('maps waypoints to six acts plus encore', () => {
    expect(ROME_ACTS).toHaveLength(7)
    expect(getActForWaypoint('w01')?.title).toBe('The Arena')
    expect(getActForWaypoint('w15')?.title).toBe('The Living City')
    expect(getActForWaypoint('w22')?.title).toBe('The Long Road')
  })
})
