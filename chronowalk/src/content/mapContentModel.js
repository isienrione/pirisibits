/**
 * MAP content-model scaffold (Day 3A).
 *
 * Sibling to `rome/manifest.json`: attach additive hero metadata + discoveries
 * after Zod parse / locale overlay. Does not alter sequences, unlock tiers,
 * journey progress, commerce, or traveler-facing UI.
 */

import { HERO_STOP_IDS } from '../i18n/audio/heroStopAudioMap.js'
import { DEFAULT_LOCALE, LOCALES, normalizeLocale } from '../i18n/locales.js'
import { JOURNEY_PACE } from '../data/romePacing.js'
import { MAP_DISCOVERIES, MAP_PLACE_OVERRIDES } from './rome/mapContent.js'

/** Closed interest vocabulary for Day-1 recommendations (MAP contract §3.4). */
export const MAP_INTEREST_TAGS = Object.freeze([
  'empire',
  'republic',
  'sacred',
  'everyday',
  'spectacle',
  'engineering',
  'artists',
])

const INTEREST_TAG_SET = new Set(MAP_INTEREST_TAGS)

export const MAP_REVEAL_TIERS = Object.freeze([null, 'worthwhile', 'flagship'])

export const MAP_UNLOCK_SCOPES = Object.freeze([
  JOURNEY_PACE.CENTRAL,
  JOURNEY_PACE.CLASSIC,
  JOURNEY_PACE.HEROIC,
  JOURNEY_PACE.OWN,
])

const UNLOCK_SCOPE_SET = new Set(MAP_UNLOCK_SCOPES)

export const MAP_DISCOVERY_ID_PATTERN = /^d_[a-z0-9_]+$/

export const MAP_CONTENT_VERSION = 1

const HERO_ID_SET = new Set(HERO_STOP_IDS)

/** Safe defaults applied to every place that lacks an override. */
export function defaultPlaceMapFields(placeId) {
  return {
    role: HERO_ID_SET.has(placeId) ? 'hero' : null,
    interestTags: [],
    timeCostMin: null,
    revealTier: null,
  }
}

function assertInterestTags(tags, label) {
  if (!Array.isArray(tags)) {
    throw new Error(`${label}: interestTags must be an array`)
  }
  for (const tag of tags) {
    if (!INTEREST_TAG_SET.has(tag)) {
      throw new Error(`${label}: unknown interestTag "${tag}"`)
    }
  }
}

function assertUnlockScopes(scopes, label) {
  if (!Array.isArray(scopes)) {
    throw new Error(`${label}: unlockScopes must be an array`)
  }
  for (const scope of scopes) {
    if (!UNLOCK_SCOPE_SET.has(scope)) {
      throw new Error(`${label}: unknown unlockScope "${scope}"`)
    }
  }
}

function assertRevealTier(tier, label) {
  if (tier === undefined) return
  if (!(MAP_REVEAL_TIERS.includes(tier) || tier === null)) {
    throw new Error(`${label}: revealTier must be null | "worthwhile" | "flagship"`)
  }
}

function assertTimeCostMin(value, label, { allowNull = true } = {}) {
  if (value == null) {
    if (!allowNull) throw new Error(`${label}: timeCostMin is required`)
    return
  }
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`${label}: timeCostMin must be a non-negative number`)
  }
}

/**
 * Validate a discoveries array against canonical place IDs.
 * @param {readonly object[]} discoveries
 * @param {{ waypointsById?: Record<string, unknown>, waypoints?: Record<string, unknown> }} placeIndex
 */
export function validateMapDiscoveries(discoveries, placeIndex = {}) {
  if (!Array.isArray(discoveries)) {
    throw new Error('MAP discoveries must be an array')
  }

  const placeIds = new Set([
    ...Object.keys(placeIndex.waypointsById ?? {}),
    ...Object.keys(placeIndex.waypoints ?? {}),
  ])

  const seen = new Set()
  for (const discovery of discoveries) {
    if (!discovery || typeof discovery !== 'object') {
      throw new Error('MAP discovery entry must be an object')
    }
    const { discoveryId, placeId, interestTags, unlockScopes, timeCostMin, geo } = discovery
    if (typeof discoveryId !== 'string' || !MAP_DISCOVERY_ID_PATTERN.test(discoveryId)) {
      throw new Error(
        `MAP discovery id "${discoveryId}" must match ${MAP_DISCOVERY_ID_PATTERN}`,
      )
    }
    if (seen.has(discoveryId)) {
      throw new Error(`MAP discovery duplicate id "${discoveryId}"`)
    }
    seen.add(discoveryId)

    if (placeId != null) {
      if (typeof placeId !== 'string' || !placeIds.has(placeId)) {
        throw new Error(
          `MAP discovery ${discoveryId}: placeId "${placeId}" is not a canonical place ID`,
        )
      }
    }

    if (geo != null) {
      if (
        typeof geo !== 'object' ||
        typeof geo.lat !== 'number' ||
        typeof geo.lng !== 'number'
      ) {
        throw new Error(`MAP discovery ${discoveryId}: geo must include numeric lat/lng`)
      }
    }

    assertInterestTags(interestTags ?? [], `MAP discovery ${discoveryId}`)
    assertUnlockScopes(unlockScopes ?? [], `MAP discovery ${discoveryId}`)
    assertTimeCostMin(timeCostMin, `MAP discovery ${discoveryId}`, { allowNull: false })

    if (discovery.title == null || discovery.summary == null) {
      throw new Error(`MAP discovery ${discoveryId}: title and summary are required`)
    }
  }

  return discoveries
}

/**
 * Validate optional place overrides (not required for production empty map).
 */
export function validateMapPlaceOverrides(overrides, placeIndex = {}) {
  if (!overrides || typeof overrides !== 'object') {
    throw new Error('MAP place overrides must be an object')
  }
  const placeIds = new Set([
    ...Object.keys(placeIndex.waypointsById ?? {}),
    ...Object.keys(placeIndex.waypoints ?? {}),
  ])
  for (const [placeId, override] of Object.entries(overrides)) {
    if (!placeIds.has(placeId)) {
      throw new Error(`MAP place override "${placeId}" is not a canonical place ID`)
    }
    if (!override || typeof override !== 'object') {
      throw new Error(`MAP place override "${placeId}" must be an object`)
    }
    assertInterestTags(override.interestTags ?? [], `MAP place ${placeId}`)
    assertRevealTier(override.revealTier ?? null, `MAP place ${placeId}`)
    assertTimeCostMin(override.timeCostMin ?? null, `MAP place ${placeId}`, {
      allowNull: true,
    })
    if (override.role != null && override.role !== 'hero') {
      throw new Error(`MAP place ${placeId}: role must be "hero" or omitted`)
    }
  }
  return overrides
}

function pickLocalizedField(field, locale) {
  if (field == null) return ''
  if (typeof field === 'string') return field
  const key = normalizeLocale(locale)
  if (typeof field[key] === 'string') return field[key]
  if (typeof field[LOCALES.EN] === 'string') return field[LOCALES.EN]
  if (typeof field.en === 'string') return field.en
  return ''
}

/** Resolve discovery copy for a locale without mutating the source record. */
export function localizeDiscovery(discovery, locale = DEFAULT_LOCALE) {
  return {
    ...discovery,
    title: pickLocalizedField(discovery.title, locale),
    summary: pickLocalizedField(discovery.summary, locale),
    interestTags: [...(discovery.interestTags ?? [])],
    unlockScopes: [...(discovery.unlockScopes ?? [])],
  }
}

function mergePlaceMapFields(placeId, baseWaypoint, override = {}) {
  const defaults = defaultPlaceMapFields(placeId)
  return {
    ...baseWaypoint,
    role: override.role ?? defaults.role,
    interestTags: Array.isArray(override.interestTags)
      ? [...override.interestTags]
      : [...defaults.interestTags],
    timeCostMin:
      override.timeCostMin !== undefined ? override.timeCostMin : defaults.timeCostMin,
    revealTier:
      override.revealTier !== undefined ? override.revealTier : defaults.revealTier,
  }
}

/**
 * Attach MAP fields to a normalized Rome manifest.
 * Additive only — sequences, product counts, and unlock consumers stay untouched.
 */
export function attachMapContent(
  manifest,
  {
    placeOverrides = MAP_PLACE_OVERRIDES,
    discoveries = MAP_DISCOVERIES,
    locale = DEFAULT_LOCALE,
  } = {},
) {
  const placeIndex = {
    waypointsById: manifest.waypointsById ?? manifest.waypoints,
    waypoints: manifest.waypointsById ?? manifest.waypoints,
  }

  validateMapPlaceOverrides(placeOverrides, placeIndex)
  validateMapDiscoveries(discoveries, placeIndex)

  const sourceById = manifest.waypointsById ?? manifest.waypoints ?? {}
  const waypointsById = {}
  for (const [placeId, waypoint] of Object.entries(sourceById)) {
    waypointsById[placeId] = mergePlaceMapFields(
      placeId,
      waypoint,
      placeOverrides[placeId],
    )
  }

  const waypoints = Array.isArray(manifest.waypoints)
    ? manifest.waypoints.map((waypoint) => {
        const id = waypoint.id
        const merged = waypointsById[id] ?? mergePlaceMapFields(id, waypoint, placeOverrides[id])
        return { ...merged, id }
      })
    : manifest.waypoints

  const localizedDiscoveries = discoveries.map((discovery) =>
    localizeDiscovery(discovery, locale),
  )

  return {
    ...manifest,
    waypointsById,
    waypoints,
    discoveries: localizedDiscoveries,
    mapContentVersion: MAP_CONTENT_VERSION,
  }
}

export function getManifestDiscoveries(manifest) {
  return Array.isArray(manifest?.discoveries) ? manifest.discoveries : []
}
