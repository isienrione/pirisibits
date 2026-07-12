import { TOUR_HERO_PHOTO } from './modernPhotoRegistry.js'
import { loadRomeManifest } from './manifest.js'
import { getTourProductTruth } from './tourProductTruth.js'

const tourHeroPhoto = TOUR_HERO_PHOTO

function resolvePlaceCount(destination) {
  if (destination.id !== 'rome') return destination.placeCount
  const manifest = loadRomeManifest()
  return getTourProductTruth(manifest).visitStopCount
}

/** Launch destination cards — Screen 2 Tour Selection. */
export const LAUNCH_DESTINATIONS = [
  {
    id: 'rome',
    city: 'Rome',
    subtitle: 'The eternal city',
    placeCount: 22,
    description:
      'Emperors, temples, and triumphs — restored on the streets where history was made.',
    heroImage: tourHeroPhoto,
    available: true,
  },
  {
    id: 'florence',
    city: 'Florence',
    subtitle: 'Cradle of the Renaissance',
    placeCount: 18,
    description:
      'Medici palaces, cathedral domes, and the art that changed how the world sees beauty.',
    heroImage: '/destinations/florence-hero.jpg',
    available: false,
  },
  {
    id: 'pompeii',
    city: 'Pompeii',
    subtitle: 'Frozen in time',
    placeCount: 12,
    description:
      'Walk the streets of a Roman city preserved beneath the ash — life stopped, then revealed.',
    heroImage: '/destinations/pompeii-hero.jpg',
    available: false,
  },
  {
    id: 'athens',
    city: 'Athens',
    subtitle: 'Birthplace of democracy',
    placeCount: 16,
    description:
      'The Acropolis, the Agora, and the golden age when philosophy shaped civilization.',
    heroImage: '/destinations/athens-hero.jpg',
    available: false,
  },
  {
    id: 'paris',
    city: 'Paris',
    subtitle: 'City of light',
    placeCount: 20,
    description:
      'Revolution, empire, and the monuments that turned a capital into a living museum.',
    heroImage: '/destinations/paris-hero.jpg',
    available: false,
  },
]

export function getLaunchDestination(id) {
  const destination = LAUNCH_DESTINATIONS.find((item) => item.id === id) ?? null
  if (!destination) return null
  return {
    ...destination,
    placeCount: resolvePlaceCount(destination),
  }
}
