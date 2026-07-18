/**
 * Coalesce concurrent waypoint narration starts so overlapping autoplay attempts
 * (e.g. arrival handler + STORY effect re-runs) share one in-flight promise
 * instead of aborting each other via playPlan generation bumps.
 */
export function createWaypointAutoplayCoordinator() {
  let startedWaypointId = null
  let inFlightWaypointId = null
  let inFlightPromise = null

  return {
    getStartedWaypointId() {
      return startedWaypointId
    },

    markStarted(waypointId) {
      startedWaypointId = waypointId
    },

    clearStarted(waypointId = null) {
      if (waypointId == null || startedWaypointId === waypointId) {
        startedWaypointId = null
      }
    },

    clearInFlight(waypointId = null) {
      if (waypointId == null || inFlightWaypointId === waypointId) {
        inFlightWaypointId = null
        inFlightPromise = null
      }
    },

    /**
     * @param {string} waypointId
     * @param {{ isPlaying?: () => boolean }} options
     * @param {() => Promise<boolean>} start
     */
    ensureStarted(waypointId, { isPlaying = () => false } = {}, start) {
      if (!waypointId) return false

      // Already live (e.g. returned to /journey while HTML audio kept playing).
      if (isPlaying()) {
        startedWaypointId = waypointId
        return true
      }

      if (startedWaypointId === waypointId) {
        startedWaypointId = null
      }

      if (inFlightWaypointId === waypointId && inFlightPromise) {
        return inFlightPromise
      }

      inFlightWaypointId = waypointId
      const promise = (async () => {
        try {
          const started = await start()
          if (started) startedWaypointId = waypointId
          return started
        } finally {
          if (inFlightWaypointId === waypointId) {
            inFlightWaypointId = null
            inFlightPromise = null
          }
        }
      })()

      inFlightPromise = promise
      return promise
    },
  }
}
