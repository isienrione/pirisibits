import { getClassicDayBreakWaypointId } from '../../content/actBoundaries.js'
import { findSequenceIndexForWaypoint } from '../../content/myTourPlan.js'
import { getManifestWaypointIds } from '../../content/mapStops.js'
import { JOURNEY_PACE } from '../../data/romePacing.js'
import { jumpToWaypointInJourney } from '../../lib/jumpToWaypoint.js'
import { grantAccess, revokeAccess } from '../../lib/config.js'
import {
  OFFLINE_AUDIO_STATUS,
  writeRomeOfflineStatus,
} from '../../audio/offlinePackage.js'
import {
  beginJourney,
  getJourneySnapshot,
  JOURNEY_STATES,
  resetJourney,
  transitionJourney,
} from '../../state/journey.js'

export const DEFAULT_QA_WAYPOINT = 'w01'
export const DEFAULT_QA_WAYPOINT_SLUG = 'colosseum'

export const UX_PERSONA_IDS = {
  FIRST_TIME_VISITOR: 'firstTimeVisitor',
  PURCHASED_FIRST_TIME: 'purchasedFirstTime',
  RETURNING_WITH_PROGRESS: 'returningWithProgress',
}

export const UX_JOURNEY_SCENE_IDS = {
  WALKING: 'walking',
  APPROACHING: 'approaching',
  ARRIVED: 'arrived',
  STORY: 'story',
  THRESHOLD: 'threshold',
  AFTER_STORY: 'afterStory',
  DAY_COMPLETE: 'dayComplete',
  FULL_COMPLETE: 'fullComplete',
  OFF_ROUTE: 'offRoute',
  MISSING_MEDIA: 'missingMedia',
  OFFLINE: 'offline',
}

export const UX_ROUTE_TARGETS = [
  { id: 'landing', label: 'Landing', path: '/landing' },
  { id: 'preview', label: 'Preview', path: '/preview' },
  { id: 'access', label: 'Access', path: '/access' },
  { id: 'setup', label: 'Setup', path: '/setup' },
  { id: 'begin', label: 'Begin', path: '/begin' },
  { id: 'tour', label: 'Tour', path: '/tour' },
  { id: 'journey', label: 'Walk', path: '/journey' },
  { id: 'map', label: 'Map', path: '/map' },
  { id: 'journal', label: 'Journal', path: '/journal' },
  { id: 'letter', label: 'Letter', path: '/letter' },
]

const JOURNEY_STATE_BY_SCENE = {
  [UX_JOURNEY_SCENE_IDS.WALKING]: JOURNEY_STATES.WALKING,
  [UX_JOURNEY_SCENE_IDS.APPROACHING]: JOURNEY_STATES.APPROACHING,
  [UX_JOURNEY_SCENE_IDS.ARRIVED]: JOURNEY_STATES.ARRIVED,
  [UX_JOURNEY_SCENE_IDS.STORY]: JOURNEY_STATES.STORY,
  [UX_JOURNEY_SCENE_IDS.THRESHOLD]: JOURNEY_STATES.THRESHOLD,
  [UX_JOURNEY_SCENE_IDS.AFTER_STORY]: JOURNEY_STATES.WALKING,
  [UX_JOURNEY_SCENE_IDS.DAY_COMPLETE]: JOURNEY_STATES.DAY_COMPLETE,
  [UX_JOURNEY_SCENE_IDS.FULL_COMPLETE]: JOURNEY_STATES.COMPLETE,
  [UX_JOURNEY_SCENE_IDS.OFF_ROUTE]: JOURNEY_STATES.WALKING,
}

const GEO_SEARCH_BY_SCENE = {
  [UX_JOURNEY_SCENE_IDS.WALKING]: { geo_debug: 'walking', debugStop: DEFAULT_QA_WAYPOINT_SLUG },
  [UX_JOURNEY_SCENE_IDS.APPROACHING]: { geo_debug: 'approaching', debugStop: DEFAULT_QA_WAYPOINT_SLUG },
  [UX_JOURNEY_SCENE_IDS.ARRIVED]: { geo_debug: 'true', debugStop: DEFAULT_QA_WAYPOINT_SLUG },
  [UX_JOURNEY_SCENE_IDS.OFF_ROUTE]: { geo_debug: 'walking', debugStop: DEFAULT_QA_WAYPOINT_SLUG },
}

export function buildReturningProgressContext(manifest, path = 'a') {
  const completedWaypointIds = ['w01', 'w02']
  const sequenceIndex = Math.max(
    0,
    findSequenceIndexForWaypoint(manifest, 'w03', path, []),
  )

  return {
    pace: JOURNEY_PACE.CLASSIC,
    path,
    currentWaypointIndex: sequenceIndex,
    currentSequenceIndex: sequenceIndex,
    completedWaypointIds,
    completedTransitIds: ['t01'],
    promotedOptionalIds: [],
    pathLocked: true,
    pendingResumeCue: null,
    customWaypointIds: null,
  }
}

export function applyFirstTimeVisitorPreset() {
  revokeAccess()
  resetJourney()
  writeRomeOfflineStatus({
    status: OFFLINE_AUDIO_STATUS.NONE,
    fileCount: 0,
    mediaFileCount: 0,
    mapTileCount: 0,
    downloadedAt: null,
    error: null,
  })

  return {
    route: '/landing',
    searchParams: {},
  }
}

export function applyPurchasedFirstTimePreset() {
  grantAccess()
  resetJourney()

  return {
    route: '/setup',
    searchParams: {},
  }
}

export function applyReturningWithProgressPreset(manifest) {
  if (!manifest) {
    return { route: '/begin', searchParams: {} }
  }

  grantAccess()
  const path = manifest.journey?.default_path ?? 'a'
  const context = buildReturningProgressContext(manifest, path)

  transitionJourney(JOURNEY_STATES.WALKING, context)

  return {
    route: '/begin',
    searchParams: {},
  }
}

function ensureOwnedJourney(manifest, waypointId = DEFAULT_QA_WAYPOINT) {
  grantAccess()

  const path = manifest.journey?.default_path ?? 'a'
  const sequenceIndex = Math.max(
    0,
    findSequenceIndexForWaypoint(manifest, waypointId, path, []),
  )

  beginJourney({
    pace: JOURNEY_PACE.CLASSIC,
    path,
    sequenceIndex,
    customWaypointIds: null,
  })

  return { path, sequenceIndex }
}

export function applyJourneyScenePreset(manifest, sceneId) {
  if (!manifest) {
    return { route: '/journey', searchParams: {} }
  }

  if (sceneId === UX_JOURNEY_SCENE_IDS.MISSING_MEDIA) {
    grantAccess()
    ensureOwnedJourney(manifest)

    return {
      route: '/journey',
      searchParams: {
        debugMedia: 'true',
        geo_debug: 'true',
        debugStop: DEFAULT_QA_WAYPOINT_SLUG,
      },
    }
  }

  if (sceneId === UX_JOURNEY_SCENE_IDS.OFFLINE) {
    grantAccess()
    ensureOwnedJourney(manifest)
    writeRomeOfflineStatus({
      status: OFFLINE_AUDIO_STATUS.COMPLETE,
      fileCount: 120,
      mediaFileCount: 48,
      mapTileCount: 96,
      downloadedAt: Date.now(),
      error: null,
    })

    return {
      route: '/tour',
      searchParams: {},
    }
  }

  if (sceneId === UX_JOURNEY_SCENE_IDS.AFTER_STORY) {
    grantAccess()
    const path = manifest.journey?.default_path ?? 'a'
    const nextIndex = Math.max(
      0,
      findSequenceIndexForWaypoint(manifest, 'w02', path, []),
    )

    beginJourney({
      pace: JOURNEY_PACE.CLASSIC,
      path,
      sequenceIndex: nextIndex,
      customWaypointIds: null,
    })

    transitionJourney(JOURNEY_STATES.WALKING, {
      completedWaypointIds: [DEFAULT_QA_WAYPOINT],
      currentSequenceIndex: nextIndex,
    })

    return {
      route: '/journey',
      searchParams: GEO_SEARCH_BY_SCENE[UX_JOURNEY_SCENE_IDS.WALKING] ?? {},
    }
  }

  if (sceneId === UX_JOURNEY_SCENE_IDS.DAY_COMPLETE) {
    grantAccess()
    const path = manifest.journey?.default_path ?? 'a'
    const breakId = getClassicDayBreakWaypointId()
    const breakIndex = Math.max(
      0,
      findSequenceIndexForWaypoint(manifest, breakId, path, []),
    )
    const tourIds = getManifestWaypointIds(manifest, path, [])
    const completedWaypointIds = tourIds.slice(0, tourIds.indexOf(breakId)).filter(Boolean)

    beginJourney({
      pace: JOURNEY_PACE.CLASSIC,
      path,
      sequenceIndex: breakIndex,
      customWaypointIds: null,
    })

    transitionJourney(JOURNEY_STATES.DAY_COMPLETE, {
      completedWaypointIds: completedWaypointIds.length ? completedWaypointIds : [breakId],
      currentSequenceIndex: breakIndex,
    })

    return {
      route: '/journey',
      searchParams: {},
    }
  }

  if (sceneId === UX_JOURNEY_SCENE_IDS.FULL_COMPLETE) {
    grantAccess()
    const path = manifest.journey?.default_path ?? 'a'
    const tourIds = getManifestWaypointIds(manifest, path, [])

    beginJourney({
      pace: JOURNEY_PACE.CLASSIC,
      path,
      sequenceIndex: Math.max(0, tourIds.length - 1),
      customWaypointIds: null,
    })

    transitionJourney(JOURNEY_STATES.COMPLETE, {
      completedWaypointIds: tourIds,
      currentSequenceIndex: Math.max(0, tourIds.length - 1),
    })

    return {
      route: '/letter',
      searchParams: {},
    }
  }

  grantAccess()
  ensureOwnedJourney(manifest)

  const targetState = JOURNEY_STATE_BY_SCENE[sceneId] ?? JOURNEY_STATES.WALKING
  const fresh = getJourneySnapshot()
  jumpToWaypointInJourney(
    manifest,
    DEFAULT_QA_WAYPOINT,
    fresh.context,
    fresh.state,
    { targetState },
  )

  return {
    route: '/journey',
    searchParams: GEO_SEARCH_BY_SCENE[sceneId] ?? {},
  }
}

export function applyUxPersonaPreset(manifest, personaId) {
  switch (personaId) {
    case UX_PERSONA_IDS.FIRST_TIME_VISITOR:
      return applyFirstTimeVisitorPreset()
    case UX_PERSONA_IDS.PURCHASED_FIRST_TIME:
      return applyPurchasedFirstTimePreset()
    case UX_PERSONA_IDS.RETURNING_WITH_PROGRESS:
      return applyReturningWithProgressPreset(manifest)
    default:
      return { route: '/landing', searchParams: {} }
  }
}

export function mergeSearchParams(currentSearch, updates) {
  const params = new URLSearchParams(currentSearch.startsWith('?') ? currentSearch.slice(1) : currentSearch)

  Object.entries(updates).forEach(([key, value]) => {
    if (value == null || value === '') params.delete(key)
    else params.set(key, String(value))
  })

  const query = params.toString()
  return query ? `?${query}` : ''
}
