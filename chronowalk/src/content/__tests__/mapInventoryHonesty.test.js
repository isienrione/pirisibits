import { beforeEach, describe, expect, it } from 'vitest'
import { clearRomeManifestCache, getTransit, getWaypoint, loadRomeManifest } from '../manifest.js'
import { HERO_STOP_IDS } from '../../i18n/audio/heroStopAudioMap.js'
import { JOURNEY_PACE, JOURNEY_PATH } from '../../data/romePacing.js'
import { TOUR_TIER_WAYPOINTS } from '../../data/tourTiers.js'
import { getTourWaypointIds } from '../myTourPlan.js'
import { jumpToWaypointInJourney } from '../../lib/jumpToWaypoint.js'
import { JOURNEY_STATES, resetJourney } from '../../state/journey.js'
import {
  canEnterJourneyRitual,
  getDay1HeroInventoryIds,
  getRecommendationSafeHeroIds,
  isRecommendationSafeHero,
} from '../mapRecommendationPool.js'
import {
  CENTRAL_ENCORE_PLACE_ID,
  CENTRAL_MARKETING_CENTRO_PLACE_IDS,
  CENTRAL_PANTHEON_INTERIOR_ID,
  CENTRAL_UNLOCK_VISIT_IDS,
  ENC_CIRCUS_TRAVERSAL,
  explainCentralMarketingProjection,
} from '../mapInventoryTruth.js'
import { LOCALES } from '../../i18n/locales.js'
import { setActiveLocale } from '../../i18n/activeLocale.js'
import { CENTRAL_ROME_TOUR } from '../../data/central-rome-tour.js'

describe('MAP inventory honesty (Day 3B)', () => {
  beforeEach(() => {
    setActiveLocale(LOCALES.EN)
    clearRomeManifestCache()
    resetJourney()
  })

  it('defines exactly the intended Day-1 hero inventory (21)', () => {
    expect(getDay1HeroInventoryIds()).toHaveLength(21)
    expect(getDay1HeroInventoryIds()).toEqual([...HERO_STOP_IDS])
    expect(HERO_STOP_IDS).toContain('enc_circus')
    expect(HERO_STOP_IDS).not.toContain('pause')
  })

  it('never treats pause as a hero recommendation', () => {
    const manifest = loadRomeManifest()
    const ctx = { pace: JOURNEY_PACE.CLASSIC, path: JOURNEY_PATH.A }
    expect(isRecommendationSafeHero(manifest, 'pause', ctx)).toBe(false)
    expect(getRecommendationSafeHeroIds(manifest, ctx)).not.toContain('pause')
  })

  it('requires valid geo on every recommendation-safe hero', () => {
    const manifest = loadRomeManifest()
    for (const path of [JOURNEY_PATH.A, JOURNEY_PATH.B]) {
      for (const pace of [JOURNEY_PACE.CENTRAL, JOURNEY_PACE.CLASSIC, JOURNEY_PACE.HEROIC]) {
        const ids = getRecommendationSafeHeroIds(manifest, { pace, path })
        for (const id of ids) {
          const geo = getWaypoint(manifest, id)?.geofence
          expect(geo?.lat).toEqual(expect.any(Number))
          expect(geo?.lng).toEqual(expect.any(Number))
          expect(geo?.radius_m).toBeGreaterThan(0)
        }
      }
    }
  })

  it('ensures every recommendation-safe hero can enter the journey ritual', () => {
    const manifest = loadRomeManifest()
    const ctx = { pace: JOURNEY_PACE.HEROIC, path: JOURNEY_PATH.B }
    for (const id of getRecommendationSafeHeroIds(manifest, ctx)) {
      expect(canEnterJourneyRitual(manifest, id, ctx)).toBe(true)
      expect(
        jumpToWaypointInJourney(manifest, id, ctx, JOURNEY_STATES.IDLE, {
          targetState: JOURNEY_STATES.WALKING,
        }),
      ).toBe(true)
      resetJourney()
    }
  })

  it('keeps unlock filtering scope-correct and never starts locked heroes', () => {
    const manifest = loadRomeManifest()
    const central = getRecommendationSafeHeroIds(manifest, {
      pace: JOURNEY_PACE.CENTRAL,
      path: JOURNEY_PATH.A,
    })
    expect(central).not.toContain('w01')
    expect(central).toContain('w14')
    expect(isRecommendationSafeHero(manifest, 'w01', { pace: JOURNEY_PACE.CENTRAL, path: 'a' })).toBe(
      false,
    )

    const classicB = getRecommendationSafeHeroIds(manifest, {
      pace: JOURNEY_PACE.CLASSIC,
      path: JOURNEY_PATH.B,
    })
    expect(classicB).toContain('enc_circus')
    expect(classicB).not.toContain('w17')
  })

  it('places enc_circus on Path B only (after Palatine, before Titus transit)', () => {
    const manifest = loadRomeManifest()
    const pathA = manifest.journey.sequences.a
    const pathB = manifest.journey.sequences.b
    expect(pathA).not.toContain('enc_circus')
    expect(pathB).toContain('enc_circus')
    expect(pathB[pathB.indexOf('w04') + 1]).toBe('enc_circus')
    expect(pathB[pathB.indexOf('enc_circus') + 1]).toBe('t03')
    expect(getTransit(manifest, 't03')?.after).toBe('enc_circus')
    expect(ENC_CIRCUS_TRAVERSAL).toMatchObject({
      pathA: false,
      pathB: true,
      afterPlaceId: 'w04',
      beforeTransitId: 't03',
    })

    expect(
      isRecommendationSafeHero(manifest, 'enc_circus', {
        pace: JOURNEY_PACE.CLASSIC,
        path: JOURNEY_PATH.A,
      }),
    ).toBe(false)
    expect(
      isRecommendationSafeHero(manifest, 'enc_circus', {
        pace: JOURNEY_PACE.CLASSIC,
        path: JOURNEY_PATH.B,
      }),
    ).toBe(true)
  })

  it('documents Central unlock 10 vs marketed centro-8 projection explicitly', () => {
    expect(CENTRAL_UNLOCK_VISIT_IDS).toEqual(TOUR_TIER_WAYPOINTS[JOURNEY_PACE.CENTRAL])
    expect(CENTRAL_UNLOCK_VISIT_IDS).toHaveLength(10)
    expect(CENTRAL_MARKETING_CENTRO_PLACE_IDS).toHaveLength(8)
    expect(CENTRAL_UNLOCK_VISIT_IDS).toContain(CENTRAL_PANTHEON_INTERIOR_ID)
    expect(CENTRAL_MARKETING_CENTRO_PLACE_IDS).not.toContain(CENTRAL_PANTHEON_INTERIOR_ID)
    expect(CENTRAL_UNLOCK_VISIT_IDS).toContain(CENTRAL_ENCORE_PLACE_ID)
    expect(CENTRAL_MARKETING_CENTRO_PLACE_IDS).not.toContain(CENTRAL_ENCORE_PLACE_ID)

    const projection = explainCentralMarketingProjection()
    expect(projection.unlockVisitCount).toBe(10)
    expect(projection.marketingCentroPlaceCount).toBe(8)
    expect(projection.recommendationAuthority).toMatch(/TOUR_TIER_WAYPOINTS/)

    // Landing projection may list Appia; still not unlock authority.
    expect(CENTRAL_ROME_TOUR.stopIds).toContain('appian-way')
    expect(CENTRAL_ROME_TOUR.stopIds).not.toContain('pantheon-interior')
  })

  it('does not derive hero inventory from landing arrays', () => {
    expect(getDay1HeroInventoryIds()).toEqual([...HERO_STOP_IDS])
    expect(getDay1HeroInventoryIds()).not.toEqual(CENTRAL_ROME_TOUR.stopIds)
    expect(HERO_STOP_IDS.every((id) => !id.includes('-') || id === 'enc_circus' || id.includes('_'))).toBe(
      true,
    )
  })

  it('keeps EN/ES hero titles working after inventory restore', () => {
    setActiveLocale(LOCALES.EN)
    clearRomeManifestCache()
    const en = loadRomeManifest()
    expect(en.waypointsById.enc_circus.title).toMatch(/Circus Maximus View/i)

    setActiveLocale(LOCALES.ES)
    clearRomeManifestCache()
    const es = loadRomeManifest()
    expect(es.waypointsById.enc_circus.title).toBeTruthy()
    expect(es.waypointsById.enc_circus.title).not.toBe(en.waypointsById.enc_circus.title)
  })

  it('lists recommendation-safe pools by unlock scope (path-aware)', () => {
    const manifest = loadRomeManifest()
    const centralA = getRecommendationSafeHeroIds(manifest, {
      pace: JOURNEY_PACE.CENTRAL,
      path: 'a',
    })
    expect(centralA).toEqual([
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

    const classicB = getRecommendationSafeHeroIds(manifest, {
      pace: JOURNEY_PACE.CLASSIC,
      path: 'b',
    })
    expect(classicB[0]).toBe('w01')
    expect(classicB).toContain('w04')
    expect(classicB).toContain('enc_circus')
    expect(classicB).not.toContain('pause')

    const heroicB = getRecommendationSafeHeroIds(manifest, {
      pace: JOURNEY_PACE.HEROIC,
      path: 'b',
    })
    expect(heroicB).toContain('enc_circus')
    expect(heroicB).toHaveLength(21) // path B visit heroes excluding pause
  })
})
