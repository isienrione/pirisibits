import { describe, expect, it } from 'vitest'
import { loadRomeManifest } from '../manifest.js'
import {
  computePublicPlaceCount,
  formatPlacesAcrossActs,
  getCatalogLandmarkIds,
  getTourProductTruth,
  getVisitStopIds,
  isVisitStop,
} from '../tourProductTruth.js'
import { JOURNEY_PACE } from '../../data/romePacing.js'

describe('tourProductTruth', () => {
  const manifest = loadRomeManifest()

  it('excludes pause from visit stops', () => {
    const pause = manifest.waypointsById.pause
    expect(isVisitStop(pause)).toBe(false)
  })

  it('counts w11_12 as two public places', () => {
    expect(computePublicPlaceCount(manifest)).toBeGreaterThanOrEqual(20)
    const w1112 = manifest.waypointsById.w11_12
    expect(w1112.display?.publicPlaceCount).toBe(2)
  })

  it('derives visit stop ids on the default path', () => {
    const eterna = getVisitStopIds(manifest, { pace: JOURNEY_PACE.HEROIC })
    const antica = getVisitStopIds(manifest, { pace: JOURNEY_PACE.CLASSIC })
    const central = getVisitStopIds(manifest, { pace: JOURNEY_PACE.CENTRAL })

    expect(eterna).not.toContain('pause')
    expect(antica).not.toContain('pause')
    expect(central).not.toContain('pause')
    expect(antica).not.toContain('w14')
    expect(central).not.toContain('w01')
    expect(eterna.length).toBeGreaterThan(antica.length)
    expect(eterna.length).toBeGreaterThan(central.length)
  })

  it('exposes canonical marketing and in-app counts from manifest product metadata', () => {
    const truth = getTourProductTruth(manifest)

    expect(truth.publicPlaceCount).toBe(22)
    expect(truth.visitStopCount).toBe(18)
    expect(truth.classicVisitStopCount).toBe(17)
    expect(truth.storyStopCount).toBe(18)
    expect(truth.publicPlacesLabel).toBe('22 places')
    expect(truth.visitStopsLabel).toBe('18 stops')
    expect(truth.durationLabel).toBe('your pace')
    expect(truth.ownershipLabel).toBe('yours forever')
    expect(truth.priceFallbackCents).toBe(1700)
    expect(truth.currency).toBe('EUR')
  })

  it('uses computed visit stop counts when pace is selected', () => {
    const central = getTourProductTruth(manifest, { pace: JOURNEY_PACE.CENTRAL })
    const antica = getTourProductTruth(manifest, { pace: JOURNEY_PACE.CLASSIC })
    const eterna = getTourProductTruth(manifest, { pace: JOURNEY_PACE.HEROIC })

    expect(central.visitStopCount).toBe(9)
    expect(antica.visitStopCount).toBe(9)
    expect(eterna.visitStopCount).toBe(18)
  })

  it('formats places across acts copy', () => {
    expect(formatPlacesAcrossActs(22, 6)).toBe('22 places across 6 acts')
  })

  it('includes optional w04 in catalog landmarks', () => {
    expect(getCatalogLandmarkIds(manifest)).toContain('w04')
  })
})
