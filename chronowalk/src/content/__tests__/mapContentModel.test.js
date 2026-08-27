import { beforeEach, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  attachMapContent,
  defaultPlaceMapFields,
  localizeDiscovery,
  MAP_CONTENT_VERSION,
  MAP_INTEREST_TAGS,
  validateMapDiscoveries,
  validateMapPlaceOverrides,
} from '../mapContentModel.js'
import { MAP_DISCOVERIES, MAP_PLACE_OVERRIDES } from '../rome/mapContent.js'
import { MAP_DISCOVERY_FIXTURES } from '../rome/__fixtures__/mapDiscoveries.fixture.js'
import { clearRomeManifestCache, loadRomeManifest } from '../manifest.js'
import { parseRomeManifest } from '../romeManifestZod.schema.js'
import rawManifest from '../rome/manifest.json'
import { getTourWaypointIds } from '../myTourPlan.js'
import { JOURNEY_PACE } from '../../data/romePacing.js'
import { TOUR_TIER_WAYPOINTS } from '../../data/tourTiers.js'
import { HERO_STOP_IDS } from '../../i18n/audio/heroStopAudioMap.js'
import { LOCALES } from '../../i18n/locales.js'
import { setActiveLocale } from '../../i18n/activeLocale.js'
import { applyLocaleOverlay } from '../../i18n/content/applyLocaleOverlay.js'

describe('MAP content model scaffold (Day 3A)', () => {
  beforeEach(() => {
    setActiveLocale(LOCALES.EN)
    clearRomeManifestCache()
  })

  it('keeps production discoveries and place overrides empty', () => {
    expect(MAP_DISCOVERIES).toEqual([])
    expect(MAP_PLACE_OVERRIDES).toEqual({})
  })

  it('loads the existing shipping manifest successfully', () => {
    const parsed = parseRomeManifest(rawManifest)
    expect(parsed.city).toBe('rome')
    expect(Object.keys(parsed.waypoints)).toContain('w01')
    const loaded = loadRomeManifest()
    expect(loaded.mapContentVersion).toBe(MAP_CONTENT_VERSION)
    expect(loaded.discoveries).toEqual([])
  })

  it('applies safe MAP defaults to legacy places', () => {
    const manifest = loadRomeManifest()
    for (const placeId of Object.keys(manifest.waypointsById)) {
      const place = manifest.waypointsById[placeId]
      expect(place.interestTags).toEqual([])
      expect(place.timeCostMin).toBeNull()
      expect(place.revealTier).toBeNull()
      if (HERO_STOP_IDS.includes(placeId)) {
        expect(place.role).toBe('hero')
      } else {
        expect(place.role).toBeNull()
      }
    }
    expect(defaultPlaceMapFields('w01')).toEqual({
      role: 'hero',
      interestTags: [],
      timeCostMin: null,
      revealTier: null,
    })
    expect(defaultPlaceMapFields('pause').role).toBeNull()
  })

  it('loads a valid discovery fixture and localizes EN/ES copy', () => {
    const parsed = parseRomeManifest(rawManifest)
    validateMapDiscoveries(MAP_DISCOVERY_FIXTURES, { waypoints: parsed.waypoints })

    const en = attachMapContent(
      {
        ...parsed,
        waypointsById: parsed.waypoints,
        waypoints: Object.entries(parsed.waypoints).map(([id, wp]) => ({ id, ...wp })),
      },
      { discoveries: MAP_DISCOVERY_FIXTURES, locale: LOCALES.EN },
    )
    expect(en.discoveries).toHaveLength(1)
    expect(en.discoveries[0].discoveryId).toBe('d_test_rostra_coin')
    expect(en.discoveries[0].title).toBe('A coin under the Rostra')
    expect(en.discoveries[0].placeId).toBe('w10')

    const es = localizeDiscovery(MAP_DISCOVERY_FIXTURES[0], LOCALES.ES)
    expect(es.title).toBe('Una moneda bajo los Rostros')
    expect(es.summary).toMatch(/curiosidad/i)
  })

  it('rejects duplicate or invalid discovery IDs', () => {
    const parsed = parseRomeManifest(rawManifest)
    const base = MAP_DISCOVERY_FIXTURES[0]

    expect(() =>
      validateMapDiscoveries(
        [
          base,
          { ...base, discoveryId: 'd_test_rostra_coin' },
        ],
        { waypoints: parsed.waypoints },
      ),
    ).toThrow(/duplicate id/)

    expect(() =>
      validateMapDiscoveries([{ ...base, discoveryId: 'rostra_coin' }], {
        waypoints: parsed.waypoints,
      }),
    ).toThrow(/must match/)

    expect(() =>
      validateMapDiscoveries([{ ...base, discoveryId: 'd_BadId' }], {
        waypoints: parsed.waypoints,
      }),
    ).toThrow(/must match/)
  })

  it('requires discovery placeId to be a canonical place when supplied', () => {
    const parsed = parseRomeManifest(rawManifest)
    expect(() =>
      validateMapDiscoveries(
        [{ ...MAP_DISCOVERY_FIXTURES[0], placeId: 'colosseum' }],
        { waypoints: parsed.waypoints },
      ),
    ).toThrow(/not a canonical place ID/)

    expect(() =>
      validateMapDiscoveries(
        [{ ...MAP_DISCOVERY_FIXTURES[0], placeId: 'w99' }],
        { waypoints: parsed.waypoints },
      ),
    ).toThrow(/not a canonical place ID/)
  })

  it('rejects unknown interest tags and reveal tiers on place overrides', () => {
    const parsed = parseRomeManifest(rawManifest)
    expect(() =>
      validateMapPlaceOverrides(
        { w01: { interestTags: ['gladiators'] } },
        { waypoints: parsed.waypoints },
      ),
    ).toThrow(/unknown interestTag/)

    expect(() =>
      validateMapPlaceOverrides(
        { w01: { revealTier: 'epic' } },
        { waypoints: parsed.waypoints },
      ),
    ).toThrow(/revealTier/)

    expect(MAP_INTEREST_TAGS).toContain('empire')
  })

  it('keeps existing EN titles and ES overlays intact after attach', () => {
    setActiveLocale(LOCALES.EN)
    clearRomeManifestCache()
    const en = loadRomeManifest()
    expect(en.waypointsById.w01.title).toBe('The Colosseum')

    const overlaid = applyLocaleOverlay(rawManifest, LOCALES.ES)
    expect(overlaid.waypoints.w01.title).toBe('El Coliseo')

    setActiveLocale(LOCALES.ES)
    clearRomeManifestCache()
    const es = loadRomeManifest()
    expect(es.waypointsById.w01.title).toBe('El Coliseo')
    expect(es.waypointsById.w01.interestTags).toEqual([])
    expect(es.discoveries).toEqual([])
  })

  it('leaves getTourWaypointIds central/classic/heroic unchanged', () => {
    const manifest = loadRomeManifest()

    // Frozen pre-MAP snapshots (path ∩ tier). Day 3B may fix enc_circus sequence drift.
    expect(getTourWaypointIds(manifest, { pace: JOURNEY_PACE.CENTRAL, path: 'a' })).toEqual([
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
    expect(getTourWaypointIds(manifest, { pace: JOURNEY_PACE.CLASSIC, path: 'a' })).toEqual([
      'w01',
      'w02',
      'w03',
      'w06',
      'w07',
      'w08',
      'pause',
      'w10',
      'w11_12',
      'w13',
    ])

    const heroic = getTourWaypointIds(manifest, { pace: JOURNEY_PACE.HEROIC, path: 'a' })
    expect(heroic[0]).toBe('w01')
    expect(heroic).toContain('w22')
    expect(heroic).not.toContain('t01')
    expect(heroic).not.toContain('enc_circus')
    expect(heroic).not.toContain('w04') // Path A omits Palatine; Path B includes it
    expect(heroic).toHaveLength(20) // path A visit stops including pause

    // Membership lists themselves must remain untouched by this scaffold.
    expect(TOUR_TIER_WAYPOINTS[JOURNEY_PACE.CLASSIC]).toContain('enc_circus')
  })

  it('does not change cw_journey_v1 progress shape', () => {
    const journeySource = readFileSync(
      resolve(process.cwd(), 'src/state/journey.js'),
      'utf8',
    )
    expect(journeySource).toContain("const STORAGE_KEY = 'cw_journey_v1'")
    expect(journeySource).toContain('completedWaypointIds: []')
    expect(journeySource).toContain('completedTransitIds: []')
    expect(journeySource).toContain('customWaypointIds: null')
    expect(journeySource).not.toContain('completedDiscoveryIds')
    expect(journeySource).not.toContain('interestTags')
    expect(journeySource).not.toContain('discoveries')
  })

  it('does not alter commerce catalog or tier membership files', () => {
    const catalog = readFileSync(
      resolve(process.cwd(), 'commerce/launchCatalog.json'),
      'utf8',
    )
    expect(catalog).toContain('rome-complete')
    expect(catalog).toContain('rome-central')

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
    expect(TOUR_TIER_WAYPOINTS[JOURNEY_PACE.CLASSIC]).toContain('enc_circus')
  })
})
