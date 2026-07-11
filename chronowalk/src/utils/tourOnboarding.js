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

/** Show map overview + instruction cards on a fresh tour with no completed stops. */
export function shouldShowTourOnboarding(context) {
  if (hasCompletedTourOnboarding()) return false
  if (!context) return false
  if ((context.completedWaypointIds?.length ?? 0) > 0) return false
  return true
}

/** First visit stop — no completed waypoints and active step is a waypoint. */
export function isOnFirstTourStop(context, step) {
  if (!shouldShowTourOnboarding(context)) return false
  if (step?.type !== 'waypoint') return false
  return (context.currentSequenceIndex ?? 0) === 0
}

export const ONBOARDING_CARD_PHASES = ['walk', 'arrive', 'listen', 'reveal']

/**
 * Which instruction card applies for the current journey moment on the first stop.
 * @returns {'walk'|'arrive'|'listen'|'reveal'|null}
 */
export function resolveTourOnboardingCardPhase({
  state,
  stepType,
  near = false,
  insideGeofence = false,
  hasReconstruction = false,
}) {
  if (stepType !== 'waypoint') return null

  const normalized = typeof state === 'string' ? state.toLowerCase() : state

  if (normalized === 'story') {
    return hasReconstruction ? 'reveal' : 'listen'
  }

  if (normalized === 'approaching' || near || insideGeofence) {
    return 'arrive'
  }

  if (normalized === 'walking') {
    return 'walk'
  }

  return null
}

export function cardCopyForPhase(phase, stopTitle = 'your first stop') {
  switch (phase) {
    case 'walk':
      return {
        eyebrow: 'Step 1 · Walk',
        title: `Head toward ${stopTitle}`,
        body: 'Follow the route on your map. Distance and walking time update as you move.',
      }
    case 'arrive':
      return {
        eyebrow: 'Step 2 · Arrive',
        title: 'Tap when you\'re there',
        body: `When you reach ${stopTitle}, tap Begin to unlock the story for this stop.`,
      }
    case 'listen':
      return {
        eyebrow: 'Step 3 · Listen',
        title: 'Narration plays here',
        body: 'The story starts automatically. Use the player below to pause, rewind, or read the transcript.',
      }
    case 'reveal':
      return {
        eyebrow: 'Step 4 · Reveal',
        title: 'Press & hold the image',
        body: 'See how this place looked centuries ago — your narration keeps playing while you explore.',
      }
    default:
      return null
  }
}
