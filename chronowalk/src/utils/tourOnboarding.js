import { getTourWaypointIds } from '../content/myTourPlan.js'

const ONBOARDING_KEY = 'cw_tour_onboarding_complete'

/** True after the traveler has finished first-tour onboarding (map + instruction cards). */
export function hasCompletedTourOnboarding() {
  if (typeof window === 'undefined') return true
  return window.localStorage.getItem(ONBOARDING_KEY) === 'true'
}

export function markTourOnboardingComplete() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ONBOARDING_KEY, 'true')
}

export function clearTourOnboarding() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(ONBOARDING_KEY)
}

/**
 * Mobile-friendly replay - open /begin?replayOnboarding=1 (add &fresh=1 to restart from scratch).
 * @returns {{ replay: boolean, fresh: boolean }}
 */
export function parseReplayOnboardingSearch(search = '') {
  const params = new URLSearchParams(search)
  return {
    replay: params.get('replayOnboarding') === '1',
    fresh: params.get('fresh') === '1',
  }
}

export function applyReplayOnboardingFromSearch(search = '') {
  const { replay, fresh } = parseReplayOnboardingSearch(search)
  if (!replay) return { replay: false, fresh: false }
  clearTourOnboarding()
  return { replay: true, fresh }
}

function isFreshTourStart(context) {
  if (!context) return true
  return (context.completedWaypointIds?.length ?? 0) === 0
}

/** Show route preview + instruction cards on a fresh tour with no completed stops. */
export function shouldShowTourOnboarding(context) {
  if (hasCompletedTourOnboarding()) return false
  return isFreshTourStart(context)
}

/** Route preview at /begin - after pace (and own-pace stop selection). */
export function shouldShowTourRoutePreview(context) {
  return shouldShowTourOnboarding(context)
}

/**
 * Opening waypoint on the active tour itinerary (no completed stops yet).
 * Independent of instruction-card onboarding completion - used for first-stop
 * directions copy so Colosseum never shows a false “open Google Maps” error.
 */
export function isOnFirstTourStop(context, step, manifest = null) {
  if (step?.type !== 'waypoint') return false
  if (!isFreshTourStart(context)) return false

  if (manifest && step.id) {
    const firstId = getTourWaypointIds(manifest, context)[0]
    if (firstId) return step.id === firstId
  }

  return (context.currentSequenceIndex ?? 0) === 0
}

export const ONBOARDING_CARD_PHASES = ['walk', 'arrive', 'listen', 'transcript', 'continue', 'reveal']

export function storyCardPhases(hasReconstruction) {
  return hasReconstruction
    ? ['listen', 'transcript', 'continue', 'reveal']
    : ['listen', 'transcript', 'continue']
}

/**
 * Which instruction card applies for the current journey moment on the first stop.
 * @returns {'walk'|'arrive'|'listen'|'transcript'|'continue'|'reveal'|null}
 */
export function resolveTourOnboardingCardPhase({
  state,
  stepType,
  near = false,
  insideGeofence = false,
  hasReconstruction = false,
  dismissedPhases = new Set(),
}) {
  if (stepType !== 'waypoint') return null

  const normalized = typeof state === 'string' ? state.toLowerCase() : state

  if (normalized === 'story') {
    for (const phase of storyCardPhases(hasReconstruction)) {
      if (!dismissedPhases.has(phase)) return phase
    }
    return null
  }

  if (normalized === 'approaching' || near || insideGeofence) {
    return dismissedPhases.has('arrive') ? null : 'arrive'
  }

  if (normalized === 'walking') {
    if (near || insideGeofence) {
      return dismissedPhases.has('arrive') ? null : 'arrive'
    }
    return dismissedPhases.has('walk') ? null : 'walk'
  }

  return null
}

export function cardCopyForPhase(phase, stopTitle = 'your first stop') {
  switch (phase) {
    case 'walk':
      return {
        eyebrow: 'Walk',
        title: `Head to ${stopTitle}`,
        body: 'Follow the route line. Distance updates as you walk.',
      }
    case 'arrive':
      return {
        eyebrow: 'Arrive',
        title: 'Tap I’m here when you arrive',
        body: 'When the map highlights your zone, start the story.',
      }
    case 'listen':
      return {
        eyebrow: 'Audio',
        title: 'Play and pause anytime',
        body: 'Narration waits until you finish or close these tips. Then use the yellow control below.',
      }
    case 'transcript':
      return {
        eyebrow: 'Read',
        title: 'Prefer reading?',
        body: 'Tap **Read instead** above the player for the full script.',
      }
    case 'continue':
      return {
        eyebrow: 'Continue',
        title: 'Ready for the next stop?',
        body: 'Use **Continue walking** at the bottom when you’re done here.',
      }
    case 'reveal':
      return {
        eyebrow: 'Reveal',
        title: 'Press & hold the photo',
        body: 'See then and now. Narration keeps playing while you hold.',
      }
    default:
      return null
  }
}
