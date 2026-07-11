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

function isFreshTourStart(context) {
  if (!context) return true
  return (context.completedWaypointIds?.length ?? 0) === 0
}

/** Show route preview + instruction cards on a fresh tour with no completed stops. */
export function shouldShowTourOnboarding(context) {
  if (hasCompletedTourOnboarding()) return false
  return isFreshTourStart(context)
}

/** Route preview at /begin — before pace and permissions. */
export function shouldShowTourRoutePreview(context) {
  return shouldShowTourOnboarding(context)
}

/** First visit stop — no completed waypoints and active step is a waypoint. */
export function isOnFirstTourStop(context, step) {
  if (!shouldShowTourOnboarding(context)) return false
  if (step?.type !== 'waypoint') return false
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
        title: `Head toward ${stopTitle}`,
        body: 'Follow the map and route line. Distance and walking time update as you move through the city.',
      }
    case 'arrive':
      return {
        eyebrow: 'Arrive',
        title: 'You\'ll know when you\'re there',
        body: `Watch the distance shrink on screen. When you're at ${stopTitle}, the map highlights your zone and the **I'm here** button appears — tap it to begin the story. GPS may also confirm arrival automatically.`,
      }
    case 'listen':
      return {
        eyebrow: 'Audio',
        title: 'Play and pause narration',
        body: 'Story audio starts when you arrive. Tap the **play / pause** button in the player to stop or resume. Rewind and speed controls sit beside it.',
      }
    case 'transcript':
      return {
        eyebrow: 'Read',
        title: 'Prefer the full script?',
        body: 'Tap **Read instead** above the player to open the complete transcript — follow along while you listen, or read quietly if audio isn\'t practical.',
      }
    case 'continue':
      return {
        eyebrow: 'Continue',
        title: 'Move to the next stop',
        body: 'When you\'re ready to leave, tap **Continue walking →** at the bottom. You can also skip ahead if you\'ve heard enough of the story.',
      }
    case 'reveal':
      return {
        eyebrow: 'Reveal',
        title: 'Press & hold the image',
        body: 'See how this place looked centuries ago — press and hold anywhere on the photo. Your narration keeps playing while you explore.',
      }
    default:
      return null
  }
}
