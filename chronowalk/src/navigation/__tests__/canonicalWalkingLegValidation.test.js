import { describe, expect, it } from 'vitest'
import {
  GEOMETRY_KIND_MAPBOX_WALKING,
  GEOMETRY_KIND_TEMPORARY,
  LEG_SOURCE_MAPBOX,
  assessCanonicalWalkingPackage,
  isRealWalkingLeg,
  validateCanonicalWalkingLeg,
} from '../canonicalWalkingLegValidation.js'

const origin = { lat: 41.8902, lng: 12.4922 }
const destination = { lat: 41.8986, lng: 12.4768 }

function realLeg(overrides = {}) {
  return {
    originStopId: 'w01',
    destinationStopId: 'w02',
    fromId: 'w01',
    toId: 'w02',
    from: origin,
    to: destination,
    distanceMeters: 850,
    durationSeconds: 680,
    geometry: {
      type: 'LineString',
      coordinates: [
        [origin.lng, origin.lat],
        [12.485, 41.894],
        [destination.lng, destination.lat],
      ],
    },
    geometryKind: GEOMETRY_KIND_MAPBOX_WALKING,
    source: LEG_SOURCE_MAPBOX,
    productDebt: false,
    validationStatus: 'ok',
    steps: [
      { instruction: 'Head northwest on Via dei Fori', distanceM: 400, type: 'depart' },
      { instruction: 'Arrive at the Pantheon', distanceM: 0, type: 'arrive' },
    ],
    ...overrides,
  }
}

describe('canonicalWalkingLegValidation', () => {
  it('accepts real Mapbox walking geometry near stop endpoints', () => {
    const result = validateCanonicalWalkingLeg(realLeg(), {
      origin,
      destination,
    })
    expect(result.ok).toBe(true)
    expect(result.report.geometryPointCount).toBe(3)
    expect(result.report.stepCount).toBe(2)
    expect(isRealWalkingLeg(realLeg())).toBe(true)
  })

  it('rejects empty geometry, zero steps, and far endpoints', () => {
    expect(
      validateCanonicalWalkingLeg(
        realLeg({
          geometry: { type: 'LineString', coordinates: [] },
          steps: [],
        }),
      ).flags,
    ).toEqual(expect.arrayContaining(['empty_geometry', 'zero_steps']))

    expect(
      validateCanonicalWalkingLeg(
        realLeg({
          geometry: {
            type: 'LineString',
            coordinates: [
              [12.0, 41.0],
              [12.01, 41.01],
            ],
          },
        }),
        { origin, destination },
      ).flags,
    ).toEqual(expect.arrayContaining(['origin_endpoint_far', 'destination_endpoint_far']))
  })

  it('rejects implausibly short or long routes', () => {
    expect(
      validateCanonicalWalkingLeg(realLeg({ distanceMeters: 5 })).flags,
    ).toContain('implausibly_short')
    expect(
      validateCanonicalWalkingLeg(realLeg({ distanceMeters: 9000 })).flags,
    ).toContain('implausibly_long')
  })

  it('accepts a legitimate adjacent short Mapbox leg (Pantheon exterior→interior)', () => {
    const pantheonExterior = { lat: 41.89885, lng: 12.47687 }
    const pantheonInterior = { lat: 41.89868, lng: 12.47683 }
    const result = validateCanonicalWalkingLeg(
      realLeg({
        originStopId: 'w17',
        destinationStopId: 'w23',
        fromId: 'w17',
        toId: 'w23',
        from: pantheonExterior,
        to: pantheonInterior,
        distanceMeters: 8,
        durationSeconds: 12,
        geometry: {
          type: 'LineString',
          coordinates: [
            [pantheonExterior.lng, pantheonExterior.lat],
            [12.47685, 41.89876],
            [pantheonInterior.lng, pantheonInterior.lat],
          ],
        },
        steps: [
          { instruction: 'Enter the Pantheon through the bronze doors', distanceM: 8, type: 'depart' },
          { instruction: 'Arrive at Pantheon interior', distanceM: 0, type: 'arrive' },
        ],
      }),
      { origin: pantheonExterior, destination: pantheonInterior },
    )
    expect(result.flags).not.toContain('implausibly_short')
    expect(result.ok).toBe(true)
    expect(result.report.adjacentStopPair).toBe(true)
    expect(result.report.stopSeparationM).toBeLessThan(80)
  })

  it('still rejects short Mapbox distance when stops are far apart', () => {
    const result = validateCanonicalWalkingLeg(
      realLeg({ distanceMeters: 8, durationSeconds: 10 }),
      { origin, destination },
    )
    expect(result.flags).toContain('implausibly_short')
    expect(result.ok).toBe(false)
  })

  it('does not treat temporary straight-line packages as complete', () => {
    const assessment = assessCanonicalWalkingPackage({
      routes: [{ legKeys: ['w01->w02'] }],
      legs: {
        'w01->w02': {
          ...realLeg(),
          geometryKind: GEOMETRY_KIND_TEMPORARY,
          source: 'authored-stop-coordinates',
          productDebt: true,
          geometry: {
            type: 'LineString',
            coordinates: [
              [origin.lng, origin.lat],
              [destination.lng, destination.lat],
            ],
          },
          validationStatus: 'temporary_fallback',
        },
      },
    })
    expect(assessment.complete).toBe(false)
    expect(assessment.temporaryFallbackLegCount).toBe(1)
    expect(assessment.realWalkingLegCount).toBe(0)
  })

  it('marks a package complete only when every leg is real walking', () => {
    const assessment = assessCanonicalWalkingPackage({
      routes: [{ legKeys: ['w01->w02'] }],
      legs: { 'w01->w02': realLeg() },
    })
    expect(assessment.complete).toBe(true)
    expect(assessment.realWalkingLegCount).toBe(1)
  })
})
