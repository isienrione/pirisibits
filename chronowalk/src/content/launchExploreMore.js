const FEATURED_JOURNEY_IDS = ['florence', 'pompeii', 'athens', 'paris']

const ASPIRATIONAL_JOURNEYS = {
  florence: {
    id: 'florence',
    city: 'Florence',
    line: 'Walk where the Renaissance learned to see.',
    heroImage: '/destinations/florence-hero.jpg',
  },
  pompeii: {
    id: 'pompeii',
    city: 'Pompeii',
    line: 'A city paused beneath ash, waiting for your footsteps.',
    heroImage: '/destinations/pompeii-hero.jpg',
  },
  athens: {
    id: 'athens',
    city: 'Athens',
    line: 'Climb to the birthplace of philosophy and light.',
    heroImage: '/destinations/athens-hero.jpg',
  },
  paris: {
    id: 'paris',
    city: 'Paris',
    line: 'Follow boulevards where empire and revolution still echo.',
    heroImage: '/destinations/paris-hero.jpg',
  },
}

/**
 * @typedef {Object} AspirationalJourney
 * @property {string} id
 * @property {string} city
 * @property {string} line
 * @property {string} heroImage
 */

/**
 * @typedef {Object} ExploreMoreContent
 * @property {string} title
 * @property {string} subtitle
 * @property {AspirationalJourney[]} journeys
 */

/**
 * @returns {ExploreMoreContent}
 */
export function getExploreMoreContent() {
  return {
    title: 'Explore more',
    subtitle: 'Other cities where walking still opens time.',
    journeys: FEATURED_JOURNEY_IDS.map((id) => ASPIRATIONAL_JOURNEYS[id]),
  }
}

export function getAspirationalJourney(id) {
  return ASPIRATIONAL_JOURNEYS[id] ?? null
}
