import { describe, expect, it } from 'vitest'
import { JOURNEY_PACE } from '../../data/romePacing.js'
import { getPackRoutePreview } from '../packRoutePreview.js'
import {
  getRoutePosterHotspots,
  ROMA_ANTICA_ROUTE_HOTSPOTS,
  ROMA_ETERNA_ROUTE_HOTSPOTS,
  ROMA_HISTORICA_ROUTE_HOTSPOTS,
} from '../routePosterHotspots.js'

function expectBoxesInsidePoster(spots) {
  for (const spot of spots) {
    expect(spot.left).toBeGreaterThanOrEqual(0)
    expect(spot.top).toBeGreaterThanOrEqual(0)
    expect(spot.left + spot.width).toBeLessThanOrEqual(100.01)
    expect(spot.top + spot.height).toBeLessThanOrEqual(100.01)
  }
}

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

  it('maps Roma Antica stickers onto Antica tour waypoint ids', () => {
    const antica = getRoutePosterHotspots('rome-essential')
    expect(antica).toEqual(ROMA_ANTICA_ROUTE_HOTSPOTS)
    expect(antica).toHaveLength(12)

    const byId = Object.fromEntries(antica.map((spot) => [spot.id, spot]))
    expect(byId['antica-1'].waypointId).toBe('w01')
    expect(byId['antica-2'].waypointId).toBe('w04')
    expect(byId['antica-2'].chapterIndex).toBe(0)
    expect(byId['antica-3'].waypointId).toBe('enc_circus')
    expect(byId['antica-4'].waypointId).toBe('w04')
    expect(byId['antica-4'].chapterIndex).toBe(2)
    expect(byId['antica-5'].waypointId).toBe('w03')
    expect(byId['antica-6'].waypointId).toBe('w06')
    expect(byId['antica-7'].waypointId).toBe('w07')
    expect(byId['antica-8'].waypointId).toBe('w08')
    expect(byId['antica-9'].waypointId).toBe('w10')
    expect(byId['antica-10'].waypointId).toBe('w11_12')
    expect(byId['antica-10'].chapterIndex).toBe(0)
    expect(byId['antica-11'].waypointId).toBe('w11_12')
    expect(byId['antica-11'].chapterIndex).toBe(1)
    expect(byId['antica-12'].waypointId).toBe('w13')
  })

  it('maps Roma Historica stickers onto centro-storico waypoint ids', () => {
    const historica = getRoutePosterHotspots('rome-central')
    expect(historica).toEqual(ROMA_HISTORICA_ROUTE_HOTSPOTS)
    expect(historica).toHaveLength(8)

    const byId = Object.fromEntries(historica.map((spot) => [spot.id, spot.waypointId]))
    expect(byId['historica-1']).toBe('w17')
    expect(byId['historica-2']).toBe('w16')
    expect(byId['historica-3']).toBe('w18')
    expect(byId['historica-4']).toBe('w20')
    expect(byId['historica-5']).toBe('w14')
    expect(byId['historica-6']).toBe('w19')
    expect(byId['historica-7']).toBe('w21')
    expect(byId['historica-8']).toBe('w15')
  })

  it('keeps hotspot boxes inside each poster', () => {
    expectBoxesInsidePoster(ROMA_ETERNA_ROUTE_HOTSPOTS)
    expectBoxesInsidePoster(ROMA_ANTICA_ROUTE_HOTSPOTS)
    expectBoxesInsidePoster(ROMA_HISTORICA_ROUTE_HOTSPOTS)
  })

  it('returns empty hotspots for unknown packs', () => {
    expect(getRoutePosterHotspots('missing')).toEqual([])
  })

  it('attaches pack hotspots on route preview for all three marketed tours', () => {
    const eterna = getPackRoutePreview(JOURNEY_PACE.HEROIC)
    const antica = getPackRoutePreview(JOURNEY_PACE.CLASSIC)
    const historica = getPackRoutePreview(JOURNEY_PACE.CENTRAL)
    expect(eterna.hotspots?.length).toBe(ROMA_ETERNA_ROUTE_HOTSPOTS.length)
    expect(antica.hotspots?.length).toBe(ROMA_ANTICA_ROUTE_HOTSPOTS.length)
    expect(historica.hotspots?.length).toBe(ROMA_HISTORICA_ROUTE_HOTSPOTS.length)
  })
})
