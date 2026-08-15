import { describe, expect, it } from 'vitest'
import { JOURNEY_PACE } from '../../data/romePacing.js'
import { getPackRoutePreview } from '../packRoutePreview.js'
import {
  getRoutePosterHotspots,
  ROMA_ETERNA_ROUTE_HOTSPOTS,
} from '../routePosterHotspots.js'

describe('routePosterHotspots', () => {
  it('maps Roma Eterna stickers onto real tour waypoint ids', () => {
    const eterna = getRoutePosterHotspots('rome-complete')
    expect(eterna.length).toBeGreaterThan(15)
    expect(eterna).toEqual(ROMA_ETERNA_ROUTE_HOTSPOTS)

    const byArt = Object.fromEntries(eterna.map((spot) => [spot.id, spot.waypointId]))
    expect(byArt['art-1']).toBe('w01')
    expect(byArt['art-2']).toBe('w02')
    expect(byArt['art-3']).toBe('w04')
    expect(byArt['art-4']).toBe('w04')
    expect(byArt['art-5']).toBe('w04')
    expect(byArt['art-6']).toBe('w03')
    expect(byArt['art-7']).toBe('w06')
    expect(byArt['art-11']).toBe('w11_12')
    expect(byArt['art-12']).toBe('w11_12')
    expect(byArt['art-13']).toBe('w14')
    expect(byArt['art-14']).toBe('w16')
    expect(byArt['art-15']).toBe('w15')
    expect(byArt['art-16']).toBe('w20')
    expect(byArt['art-17']).toBe('w17')
    expect(byArt['art-18']).toBe('w23')
    expect(byArt['art-19']).toBe('w18')
    expect(byArt['art-20']).toBe('w19')
    expect(byArt['art-21']).toBe('w21')
    expect(byArt['art-22']).toBe('w22')

    expect(eterna.find((spot) => spot.id === 'art-4')?.chapterIndex).toBe(1)
    expect(eterna.find((spot) => spot.id === 'art-5')?.chapterIndex).toBe(2)
    expect(eterna.find((spot) => spot.id === 'art-12')?.chapterIndex).toBe(1)
  })

  it('keeps hotspot boxes inside the poster', () => {
    for (const spot of ROMA_ETERNA_ROUTE_HOTSPOTS) {
      expect(spot.left).toBeGreaterThanOrEqual(0)
      expect(spot.top).toBeGreaterThanOrEqual(0)
      expect(spot.left + spot.width).toBeLessThanOrEqual(100.01)
      expect(spot.top + spot.height).toBeLessThanOrEqual(100.01)
    }
  })

  it('returns empty hotspots for packs without mapped stickers', () => {
    expect(getRoutePosterHotspots('rome-essential')).toEqual([])
    expect(getRoutePosterHotspots('rome-central')).toEqual([])
    expect(getRoutePosterHotspots('missing')).toEqual([])
  })

  it('attaches Eterna hotspots on pack route preview', () => {
    const eterna = getPackRoutePreview(JOURNEY_PACE.HEROIC)
    const antica = getPackRoutePreview(JOURNEY_PACE.CLASSIC)
    expect(eterna.hotspots?.length).toBe(ROMA_ETERNA_ROUTE_HOTSPOTS.length)
    expect(antica.hotspots).toEqual([])
  })
})
