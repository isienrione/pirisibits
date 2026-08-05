/**
 * Progress domain contracts — route and stop completion state.
 */

/**
 * @typedef {Object} StopProgress
 * @property {string} stopId Stop identity (not a route index).
 * @property {boolean} [visited] Traveler arrived / opened the stop.
 * @property {boolean} [completed] Traveler finished required stop content.
 * @property {number} [audioPositionMs] Last known narration position.
 * @property {string} [updatedAt] ISO-8601 timestamp of last change.
 */

/**
 * @typedef {Object} RouteProgress
 * @property {string} routeId Route being walked.
 * @property {string} [cityId] Owning city when multi-city catalogs coexist.
 * @property {StopProgress[]} stops Per-stop progress keyed by stopId.
 * @property {string} [currentStopId] Active stop identity, if any.
 * @property {string} [updatedAt] ISO-8601 timestamp of last change.
 */

/**
 * @param {StopProgress} progress
 * @returns {progress is StopProgress}
 */
export function isStopProgress(progress) {
  return (
    !!progress &&
    typeof progress === 'object' &&
    typeof progress.stopId === 'string' &&
    progress.stopId.length > 0
  )
}

/**
 * @param {RouteProgress} progress
 * @returns {progress is RouteProgress}
 */
export function isRouteProgress(progress) {
  return (
    !!progress &&
    typeof progress === 'object' &&
    typeof progress.routeId === 'string' &&
    progress.routeId.length > 0 &&
    Array.isArray(progress.stops) &&
    progress.stops.every(isStopProgress)
  )
}
