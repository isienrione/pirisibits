/**
 * @typedef {Object} JourneyLetter
 * @property {string} salutation
 * @property {string[]} paragraphs
 * @property {string} signOff
 * @property {string} signature
 * @property {string[]} visitedPlaces
 */

/**
 * @param {import('./manifest.schema.js').RomeTourManifest | null | undefined} manifest
 * @param {{ completedStopIds?: string[], currentStopId?: string | null }} context
 */
export function collectVisitedStops(manifest, context) {
  if (!manifest?.stops?.length) return []

  const visitedIds = new Set(
    [...(context?.completedStopIds ?? []), context?.currentStopId].filter(Boolean)
  )

  return manifest.stops.filter((stop) => visitedIds.has(stop.id))
}

function formatPlaceList(places) {
  if (!places.length) return ''
  if (places.length === 1) return places[0]
  if (places.length === 2) return `${places[0]} and ${places[1]}`

  const head = places.slice(0, -1).join(', ')
  const tail = places.at(-1)
  return `${head}, and ${tail}`
}

/**
 * @param {{
 *   travelerName?: string,
 *   manifest?: import('./manifest.schema.js').RomeTourManifest | null,
 *   context?: { completedStopIds?: string[], currentStopId?: string | null },
 * }} options
 * @returns {JourneyLetter}
 */
export function buildJourneyLetter({ travelerName = 'Traveler', manifest, context }) {
  const visitedStops = collectVisitedStops(manifest, context)
  const visitedPlaces = visitedStops.map((stop) => stop.shortTitle ?? stop.title)
  const placeRoll = formatPlaceList(visitedPlaces.slice(0, 4))

  const paragraphs = [
    'You set out on foot through a city that has never stopped remembering itself.',
    visitedPlaces.length
      ? `Along the way, you found ${placeRoll}${visitedPlaces.length > 4 ? ` · and ${visitedPlaces.length - 4} more places that asked you to stand still` : ''}. At each arrival, the present loosened its grip. Story followed. Then threshold.`
      : 'Along the way, you learned to arrive · not as a visitor passing through, but as someone willing to stand still long enough for the city to speak.',
    'You listened. You crossed from the world as it is into reconstructions of what Rome dared to build. You held the camera up to time and let the ancient settle over the modern, even for a moment.',
    'This was not a tour completed. It was a pace chosen, an attention kept, a willingness to let stone carry memory forward.',
    'Wherever you walk next, carry this: you have already learned how to arrive.',
  ]

  return {
    salutation: `Dear ${travelerName},`,
    paragraphs,
    signOff: 'With gratitude,',
    signature: 'ChronoWalk',
    visitedPlaces,
  }
}
