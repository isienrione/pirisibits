import { COLOSSEUM_VIEWPOINT } from '../data/colosseum.js'

/**
 * Dev-only Rome GPS fixtures for QA outside the city.
 * Origin sits on the visitor approach to the Colosseum facade so a walking
 * route to the Colosseum (or onward to Forum / Pantheon) is always possible.
 */

/** Fixed QA origin ~120 m NW of the Colosseum facade. */
export const SIMULATED_ROME_ORIGIN = Object.freeze({
  lat: COLOSSEUM_VIEWPOINT.lat,
  lng: COLOSSEUM_VIEWPOINT.lng,
})

/**
 * Short track along Via dei Fori Imperiali toward the Colosseum.
 * Used when simulate mode requests an animated walk instead of a fixed pin.
 */
export const SIMULATED_ROME_TRACK = Object.freeze([
  Object.freeze({ lat: 41.89285, lng: 12.48645 }),
  Object.freeze({ lat: 41.89235, lng: 12.48785 }),
  Object.freeze({ lat: 41.89175, lng: 12.48935 }),
  Object.freeze({ lat: COLOSSEUM_VIEWPOINT.lat, lng: COLOSSEUM_VIEWPOINT.lng }),
])

/**
 * @param {{ track?: boolean, trackIndex?: number }} [options]
 * @returns {{ lat: number, lng: number }}
 */
export function getSimulatedRomePosition({ track = false, trackIndex = 0 } = {}) {
  if (!track) return SIMULATED_ROME_ORIGIN

  const index = Math.max(0, Math.min(trackIndex, SIMULATED_ROME_TRACK.length - 1))
  return SIMULATED_ROME_TRACK[index]
}
