const COMPLETE_MOMENTS = {
  'rome-launch': {
    headline: 'You walked Ancient Rome.',
    subline: 'The basalt under your feet outlasted empire. The road is still here — and so are you.',
    heroImage: '/waypoints/via-appia/modern-poster.jpg',
  },
  default: {
    headline: 'You walked Ancient Rome.',
    subline: 'Some journeys change how quietly you stand in a place.',
    heroImage: '/waypoints/pantheon/ancient-poster.jpg',
  },
}

/**
 * @param {{ id?: string }} manifest
 */
export function getJourneyCompleteMoment(manifest) {
  return COMPLETE_MOMENTS[manifest?.id] ?? COMPLETE_MOMENTS.default
}
