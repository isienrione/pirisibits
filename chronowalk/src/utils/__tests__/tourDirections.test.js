import { describe, expect, it } from 'vitest'
import { ROME_CORE_TOUR } from '../../data/rome-core-tour'
import { getTourDirectionsOrigin } from '../tourDirections'

describe('getTourDirectionsOrigin', () => {
  it('returns the last arrived stop as the leg origin', () => {
    const origin = getTourDirectionsOrigin(ROME_CORE_TOUR, {
      targetStopIndex: 1,
      arrivedStopIds: ['colosseum'],
      transitLegActive: true,
    })

    expect(origin).toMatchObject({
      lat: expect.any(Number),
      lng: expect.any(Number),
      title: 'Colosseum',
    })
  })

  it('returns null before any stop has been visited', () => {
    expect(
      getTourDirectionsOrigin(ROME_CORE_TOUR, {
        targetStopIndex: 0,
        arrivedStopIds: [],
        transitLegActive: false,
      })
    ).toBeNull()
  })
})
