import { COMPANION_MODES } from './companionGuidance.js'
import { formatDistanceToNext, formatWalkingTime } from './journeyProgress.js'
import { JOURNEY_STATES } from '../state/journey.js'
import { t } from '../i18n/t.js'

export const MAP_BOTTOM_CARD_STATES = {
  AWAITING_FIRST: 'awaiting_first',
  WALKING: 'walking',
  APPROACHING: 'approaching',
  ARRIVED: 'arrived',
  AFTER_STORY: 'after_story',
  OFF_ROUTE: 'off_route',
}

export const MAP_BOTTOM_CTA = {
  GET_DIRECTIONS: 'get_directions',
  OPEN_DIRECTIONS: 'open_directions',
  MANUAL_ARRIVAL: 'manual_arrival',
  OPEN_STORY: 'open_story',
  WALK_TO_NEXT: 'walk_to_next',
  BACK_TO_ROUTE: 'back_to_route',
}

function formatDistanceMeta(distanceM, { about = false } = {}) {
  const distance = formatDistanceToNext(distanceM)
  const walkTime = formatWalkingTime(distanceM)
  if (!distance && !walkTime) return null
  if (!distance) return walkTime
  if (!walkTime) return distance
  return about
    ? t('map.card.meta.about', { distance, walkTime })
    : t('map.card.meta.pair', { distance, walkTime })
}

function resolveLandmarkTitle(waypoint, fallbackStop) {
  return waypoint?.title ?? waypoint?.name ?? fallbackStop?.title ?? t('map.card.nextStop')
}

/**
 * Derives the map bottom-card copy and CTA from journey + geo context.
 */
export function resolveMapBottomCard({
  journeyState,
  step,
  activeStop,
  distanceM,
  companionMode,
  sequenceIndex = 0,
  completedWaypointIds = [],
  directionsOpen = false,
}) {
  if (!step || step.done) return null

  const targetWaypoint =
    step.type === 'waypoint' ? step.record : step.targetWaypoint ?? step.record
  const landmark = resolveLandmarkTitle(targetWaypoint, activeStop)
  const nextLandmark = step.type === 'transit' ? resolveLandmarkTitle(step.targetWaypoint, null) : landmark

  const isTourStart =
    sequenceIndex === 0 && completedWaypointIds.length === 0 && step.type === 'waypoint'

  if (
    companionMode === COMPANION_MODES.OFF_ROUTE &&
    (journeyState === JOURNEY_STATES.WALKING || journeyState === JOURNEY_STATES.APPROACHING)
  ) {
    return {
      stateId: MAP_BOTTOM_CARD_STATES.OFF_ROUTE,
      title: t('map.card.offRoute.title'),
      meta: t('map.card.offRoute.meta'),
      ctaLabel: t('map.card.offRoute.cta'),
      ctaAction: MAP_BOTTOM_CTA.BACK_TO_ROUTE,
      landmark,
    }
  }

  if (journeyState === JOURNEY_STATES.ARRIVED) {
    return {
      stateId: MAP_BOTTOM_CARD_STATES.ARRIVED,
      title: t('map.card.arrived.title'),
      meta: landmark,
      ctaLabel: t('map.card.arrived.cta'),
      ctaAction: MAP_BOTTOM_CTA.OPEN_STORY,
      landmark,
    }
  }

  if (journeyState === JOURNEY_STATES.APPROACHING) {
    return {
      stateId: MAP_BOTTOM_CARD_STATES.APPROACHING,
      title: t('map.card.approaching.titleNamed', { landmark }),
      meta: t('map.card.approaching.meta'),
      ctaLabel: t('map.card.approaching.cta'),
      ctaAction: MAP_BOTTOM_CTA.MANUAL_ARRIVAL,
      landmark,
    }
  }

  if (journeyState === JOURNEY_STATES.WALKING && step.type === 'transit') {
    return {
      stateId: MAP_BOTTOM_CARD_STATES.AFTER_STORY,
      title: t('map.card.afterStory.titleShort'),
      meta: nextLandmark,
      ctaLabel: t('map.card.afterStory.ctaNamed', { landmark: nextLandmark }),
      ctaAction: MAP_BOTTOM_CTA.WALK_TO_NEXT,
      landmark: nextLandmark,
    }
  }

  if (
    journeyState === JOURNEY_STATES.IDLE ||
    (journeyState === JOURNEY_STATES.WALKING && isTourStart && !directionsOpen)
  ) {
    return {
      stateId: MAP_BOTTOM_CARD_STATES.AWAITING_FIRST,
      title: t('map.card.awaiting.titleNamed', { landmark }),
      meta: formatDistanceMeta(distanceM),
      ctaLabel: t('map.card.awaiting.cta.walking'),
      ctaAction: MAP_BOTTOM_CTA.GET_DIRECTIONS,
      landmark,
    }
  }

  if (journeyState === JOURNEY_STATES.WALKING && step.type === 'waypoint') {
    return {
      stateId: MAP_BOTTOM_CARD_STATES.WALKING,
      title: t('map.card.walking.titleNamed', { landmark }),
      meta: formatDistanceMeta(distanceM, { about: true }),
      ctaLabel: t('map.card.walking.cta'),
      ctaAction: MAP_BOTTOM_CTA.OPEN_DIRECTIONS,
      landmark,
    }
  }

  if (journeyState === JOURNEY_STATES.STORY || journeyState === JOURNEY_STATES.THRESHOLD) {
    return {
      stateId: MAP_BOTTOM_CARD_STATES.ARRIVED,
      title: t('map.card.arrived.title'),
      meta: landmark,
      ctaLabel: t('map.card.arrived.cta'),
      ctaAction: MAP_BOTTOM_CTA.OPEN_STORY,
      landmark,
    }
  }

  if (journeyState === JOURNEY_STATES.PAUSED && step.type === 'waypoint') {
    return {
      stateId: MAP_BOTTOM_CARD_STATES.WALKING,
      title: t('map.card.walking.titleNamed', { landmark }),
      meta: formatDistanceMeta(distanceM, { about: true }),
      ctaLabel: t('map.card.walking.cta'),
      ctaAction: MAP_BOTTOM_CTA.OPEN_DIRECTIONS,
      landmark,
    }
  }

  return null
}
