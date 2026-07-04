import { getFirstStop } from '../content/romeTourManifest'
import { JOURNEY_STATES, setJourneyState, updateJourneyContext } from './journeyState'

/**
 * Initialize the launch tour at the first (or chosen) stop and enter walking state.
 * @param {import('../content/manifest.schema.js').RomeTourManifest} manifest
 * @param {{ stopId?: string | null }} [options]
 */
export function beginLaunchTour(manifest, options = {}) {
  const stop =
    (options.stopId && manifest.stopsById[options.stopId]) || getFirstStop(manifest)

  if (!stop) return null

  const startedAt = new Date().toISOString()

  updateJourneyContext({
    currentStopId: stop.id,
    currentStopIndex: stop.number - 1,
    completedStopIds: [],
    audioProgress: 0,
    hasAccess: true,
    journeyStartedAt: startedAt,
  })
  setJourneyState(JOURNEY_STATES.WALKING)
  return stop
}
