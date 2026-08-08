import { describe, expect, it } from 'vitest'
import {
  areCanonicalRomeLegsPackaged,
  areCanonicalRomeWalkingRoutesComplete,
  getCanonicalWalkingLeg,
  getCanonicalWalkingLegsMeta,
  isCanonicalTourSupported,
  listTemporaryFallbackLegKeys,
  CANONICAL_LEG_MISSING_COPY,
  CANONICAL_LEGS_VERSION,
} from '../canonicalWalkingLegs.js'

describe('canonicalWalkingLegs', () => {
  it('supports Rome tour ids', () => {
    expect(isCanonicalTourSupported('rome')).toBe(true)
    expect(isCanonicalTourSupported('ROME')).toBe(true)
    expect(isCanonicalTourSupported('paris')).toBe(false)
  })

  it('looks up a packaged stop→stop leg with distance, ETA, steps, and geometry', () => {
    const leg = getCanonicalWalkingLeg({
      tourId: 'rome',
      fromId: 'w01',
      toId: 'w02',
    })
    expect(leg).not.toBeNull()
    expect(leg?.source).toBe('canonical-leg')
    expect(leg?.version).toBe(CANONICAL_LEGS_VERSION)
    expect(leg?.originStopId).toBe('w01')
    expect(leg?.destinationStopId).toBe('w02')
    expect(leg?.distanceMeters).toBeGreaterThan(0)
    expect(leg?.durationSeconds).toBeGreaterThan(0)
    expect(leg?.steps?.length).toBeGreaterThan(0)
    expect(leg?.steps?.[0]?.instruction).toMatch(/Head|toward|Arrive/i)
    expect(leg?.geometry?.type).toBe('LineString')
    expect(leg?.geometry?.coordinates?.length).toBeGreaterThanOrEqual(2)
  })

  it('exposes provenance for temporary geometry until Mapbox capture', () => {
    const leg = getCanonicalWalkingLeg({ tourId: 'rome', fromId: 'w01', toId: 'w02' })
    expect(leg?.geometryKind).toBe('temporary-straight-line-fallback')
    expect(leg?.productDebt).toBe(true)
    expect(leg?.isRealWalking).toBe(false)
    expect(leg?.legSource).toBe('authored-stop-coordinates')
  })

  it('returns null for reverse / unsupported legs', () => {
    expect(
      getCanonicalWalkingLeg({ tourId: 'rome', fromId: 'w02', toId: 'w01' }),
    ).toBeNull()
    expect(
      getCanonicalWalkingLeg({ tourId: 'rome', fromId: 'nope', toId: 'w02' }),
    ).toBeNull()
    expect(
      getCanonicalWalkingLeg({ tourId: 'paris', fromId: 'w01', toId: 'w02' }),
    ).toBeNull()
  })

  it('packages walking legs but excludes optional Appia ride from completeness', () => {
    const meta = getCanonicalWalkingLegsMeta()
    expect(meta.legCount).toBe(20)
    expect(meta.allLegsUseTemporaryFallbackGeometry).toBe(true)
    expect(meta.productDebtLegCount).toBe(20)
    expect(meta.realWalkingLegCount).toBe(0)
    expect(meta.complete).toBe(false)
    expect(areCanonicalRomeLegsPackaged()).toBe(true)
    expect(areCanonicalRomeWalkingRoutesComplete()).toBe(false)
    expect(listTemporaryFallbackLegKeys()).toContain('w01->w02')
    expect(listTemporaryFallbackLegKeys()).toContain('w17->w23')
    expect(listTemporaryFallbackLegKeys()).not.toContain('w21->w22')
    expect(getCanonicalWalkingLeg({ tourId: 'rome', fromId: 'w21', toId: 'w22' })).toBeNull()
    expect(CANONICAL_LEG_MISSING_COPY).toMatch(/isn’t prepared yet/)
  })
})
