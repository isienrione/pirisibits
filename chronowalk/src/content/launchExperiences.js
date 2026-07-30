import { TOUR_HERO_PHOTO } from './modernPhotoRegistry.js'

const tourHeroPhoto = TOUR_HERO_PHOTO

/** Screen 6 - experience modes for a launch destination. */
export const ROME_LAUNCH_EXPERIENCES = [
  {
    id: 'classic-split',
    title: 'Take it in chapters',
    duration: 'Your pace',
    walkingStyle: 'Forum core, then the city loop',
    description:
      'A natural order if you want structure - ancient stops first, then the living city. Take a week between chapters if you like.',
    heroImage: tourHeroPhoto,
  },
  {
    id: 'heroic-day',
    title: 'The full day',
    duration: '~8 hours',
    walkingStyle: 'One ambitious circuit',
    description:
      'Walk the full journey in a single day - for travelers who want every landmark while the light holds.',
    heroImage: '/waypoints/colosseum/exterior/ancient-poster.jpg',
  },
  {
    id: 'your-own-pace',
    title: 'Your own pace',
    duration: 'No limit',
    walkingStyle: 'Pause anytime',
    description:
      'No schedule, no rush. Return whenever you like - Rome unlocks story by story, on your terms.',
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
