import { describe, expect, it } from 'vitest'
import { MAPBOX_WALKING_PROFILE } from '../fetchWalkingRoute'

describe('fetchWalkingRoute', () => {
  it('uses Mapbox walking profile only', () => {
    expect(MAPBOX_WALKING_PROFILE).toBe('walking')
  })
})
