import { PANTHEON_STOP_IDS } from '../i18n/audio/heroStopAudioMap.js'
import { JOURNEY_PACE, JOURNEY_PATH } from '../data/romePacing.js'
import { loadRomeManifest } from '../content/manifest.js'
import { canAccessHero } from './contentAccess.js'
import { hasValidLocalAccess } from './accessSession.js'
import { jumpToWaypointInJourney } from './jumpToWaypoint.js'
import { beginJourney, getJourneySnapshot, JOURNEY_STATES } from '../state/journey.js'
import { track, TRACK_EVENTS } from './track.js'
import { COVERAGE_LABELS } from '../content/rome/heroRecommendationMeta.js'
import { ROME_HERO_META } from '../content/rome/heroRecommendationMeta.js'

function playableIdsForHero(heroId) {
  if (heroId === 'w17') return [...PANTHEON_STOP_IDS]
  return [heroId]
}

export function coverageLabelForHero(heroId) {
  const scopes = ROME_HERO_META[heroId]?.unlockScopes ?? []
  const paid = scopes.find((scope) => scope !== 'rome-free')
  return COVERAGE_LABELS[paid] || COVERAGE_LABELS['rome-historic-center']
}

export function coverageIncludesForHero(heroId) {
  const label = coverageLabelForHero(heroId)
  if (label === COVERAGE_LABELS['rome-ancient']) {
    return 'Colosseum, Forum, Palatine, and Circus Maximus View.'
  }
  if (label === COVERAGE_LABELS['rome-complete']) {
    return 'All 21 Heroes across central Rome, including Via Appia.'
  }
  return 'Historic Center: Trevi, Spanish Steps, piazzas, and the living city.'
}

/**
 * Start the canonical player for a Hero.
 * Guests may start only Heroes `canAccessHero` allows (Pantheon).
 * Does not open Paddle. Locked returns `{ ok: false, reason: 'locked' }`.
 */
export function startHeroExperience(heroId, { manifest = loadRomeManifest(), navigate } = {}) {
  if (!heroId) return { ok: false, reason: 'missing' }
  if (!canAccessHero(heroId)) {
    track(TRACK_EVENTS.LOCKED_EXPERIENCE_OPENED, { hero_id: heroId })
    return { ok: false, reason: 'locked', heroId }
  }

  const entitled = hasValidLocalAccess()
  if (entitled) {
    const snap = getJourneySnapshot()
    jumpToWaypointInJourney(manifest, heroId, snap.context, snap.state, {
      targetState: JOURNEY_STATES.WALKING,
    })
    track(TRACK_EVENTS.RECOMMENDATION_ACCEPTED, { hero_id: heroId, entitled: true })
    navigate?.('/journey')
    return { ok: true, path: '/journey', heroId, entitled: true }
  }

  const customWaypointIds = playableIdsForHero(heroId)
  beginJourney({
    pace: JOURNEY_PACE.OWN,
    path: JOURNEY_PATH.A,
    waypointIndex: 0,
    sequenceIndex: 0,
    customWaypointIds,
  })
  track(TRACK_EVENTS.RECOMMENDATION_ACCEPTED, { hero_id: heroId, entitled: false })
  if (PANTHEON_STOP_IDS.includes(heroId)) {
    track(TRACK_EVENTS.FREE_EXPERIENCE_STARTED, { hero_id: heroId })
  }
  navigate?.('/journey')
  return { ok: true, path: '/journey', heroId, entitled: false, customWaypointIds }
}

export function shouldTrackFreeExperienceComplete(waypointId, context) {
  if (!waypointId || !context) return false
  const custom = context.customWaypointIds
  if (!Array.isArray(custom) || custom.length === 0) return false
  if (!custom.every((id) => PANTHEON_STOP_IDS.includes(id))) return false
  return waypointId === custom[custom.length - 1]
}
