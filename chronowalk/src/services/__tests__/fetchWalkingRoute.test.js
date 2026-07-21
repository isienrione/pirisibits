import { describe, expect, it } from 'vitest'
import { buildWalkingDirectionsUrl } from '../fetchWalkingRoute.js'

describe('buildWalkingDirectionsUrl', () => {
  it('requests walking profile with steps and geojson geometry', () => {
    const url = buildWalkingDirectionsUrl(
      { lat: 41.891275, lng: 12.491202 },
      { lat: 41.8986, lng: 12.4768 },
      'pk.test-token',
      { destinationName: 'Pantheon' },
    )

    expect(url).toContain('https://api.mapbox.com/directions/v5/mapbox/walking/')
    expect(url).toContain('12.491202,41.891275;12.4768,41.8986')

    const params = new URL(url).searchParams
    expect(params.get('geometries')).toBe('geojson')
    expect(params.get('steps')).toBe('true')
    expect(params.get('overview')).toBe('full')
    expect(params.get('banner_instructions')).toBe('true')
    expect(params.get('access_token')).toBe('pk.test-token')
    expect(params.get('waypoint_names')).toBe(';Pantheon')
  })
})
