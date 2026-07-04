const tourHeroPhoto = `/tour-hero.jpg?v=${__APP_BUILD_ID__}`

/** Screen 6 — experience modes for a launch destination. */
export const ROME_LAUNCH_EXPERIENCES = [
  {
    id: 'classic-split',
    title: 'The Classic Split',
    duration: '2 days',
    walkingStyle: 'Morning forum · afternoon city',
    description:
      'Divide Rome into two unhurried chapters — the Forum cluster, then the grand city loop.',
    heroImage: tourHeroPhoto,
  },
  {
    id: 'heroic-day',
    title: 'The Heroic Day',
    duration: '8 hours',
    walkingStyle: 'One ambitious circuit',
    description:
      'Walk the full journey in a single day — for travelers who want every landmark while the light holds.',
    heroImage: '/waypoints/colosseum/exterior/ancient-poster.jpg',
  },
  {
    id: 'your-own-pace',
    title: 'Your Own Pace',
    duration: 'No limit',
    walkingStyle: 'Pause anytime',
    description:
      'No schedule, no rush. Return whenever you like — Rome unlocks story by story, on your terms.',
    heroImage: '/waypoints/pantheon/ancient-poster.jpg',
  },
]

const EXPERIENCE_SETS = {
  rome: ROME_LAUNCH_EXPERIENCES,
}

export function getLaunchExperiences(destinationId) {
  return EXPERIENCE_SETS[destinationId] ?? []
}

export function getLaunchExperience(destinationId, experienceId) {
  return getLaunchExperiences(destinationId).find((experience) => experience.id === experienceId) ?? null
}
