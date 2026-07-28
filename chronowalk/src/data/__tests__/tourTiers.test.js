import { describe, expect, it } from 'vitest'
import { loadRomeManifest } from '../../content/manifest.js'
import { JOURNEY_PACE } from '../romePacing.js'
import { getTourWaypointIds, isLastTourWaypoint } from '../../content/myTourPlan.js'
import { getVisitStopIds } from '../../content/tourProductTruth.js'
import { TOUR_TIER_WAYPOINTS } from '../tourTiers.js'

describe('tourTiers', () => {
  const manifest = loadRomeManifest()

  it('defines Roma Historica as centro storico + Pantheon + Via Appia', () => {
    expect(TOUR_TIER_WAYPOINTS[JOURNEY_PACE.CENTRAL]).toEqual([
      'w14',
      'w15',
      'w16',
      'w17',
      'w23',
      'w18',
      'w19',
      'w20',
      'w21',
      'w22',
    ])
  })

  it('defines Roma Antica as Colosseum, Palatine, Forum, Capitoline, and Circus', () => {
    expect(TOUR_TIER_WAYPOINTS[JOURNEY_PACE.CLASSIC]).toContain('w01')
    expect(TOUR_TIER_WAYPOINTS[JOURNEY_PACE.CLASSIC]).toContain('w04')
    expect(TOUR_TIER_WAYPOINTS[JOURNEY_PACE.CLASSIC]).toContain('w13')
    expect(TOUR_TIER_WAYPOINTS[JOURNEY_PACE.CLASSIC]).toContain('enc_circus')
    expect(TOUR_TIER_WAYPOINTS[JOURNEY_PACE.CLASSIC]).not.toContain('w14')
    expect(TOUR_TIER_WAYPOINTS[JOURNEY_PACE.CLASSIC]).not.toContain('w17')
  })

  it('returns distinct visit stop counts per tier', () => {
    const central = getVisitStopIds(manifest, { pace: JOURNEY_PACE.CENTRAL })
    const anticaPathB = getVisitStopIds(manifest, {
      pace: JOURNEY_PACE.CLASSIC,
      path: 'b',
    })
    const eterna = getVisitStopIds(manifest, { pace: JOURNEY_PACE.HEROIC })

    expect(central).toHaveLength(10)
    expect(anticaPathB).toHaveLength(11)
    expect(anticaPathB).toContain('enc_circus')
    expect(eterna.length).toBeGreaterThan(central.length)
    expect(eterna.length).toBeGreaterThan(anticaPathB.length)
  })

  it('marks the final tier waypoint for tour completion', () => {
    const anticaContext = {
      pace: JOURNEY_PACE.CLASSIC,
      path: 'b',
      promotedOptionalIds: [],
    }
    expect(isLastTourWaypoint('w13', manifest, anticaContext)).toBe(true)
    expect(isLastTourWaypoint('enc_circus', manifest, anticaContext)).toBe(false)

    const centralContext = { pace: JOURNEY_PACE.CENTRAL, path: 'a' }
    expect(isLastTourWaypoint('w22', manifest, centralContext)).toBe(true)
    expect(getTourWaypointIds(manifest, centralContext)[0]).toBe('w14')
  })
})
