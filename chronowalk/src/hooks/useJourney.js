import { useMemo, useSyncExternalStore } from 'react'
import {
  JOURNEY_STATES,
  getJourneySnapshot,
  resetJourney,
  setJourneyState,
  subscribeJourney,
  updateJourneyContext,
} from '../state/journeyState'
import { getCurrentStop, loadRomeTourManifest } from '../content/romeTourManifest'

export function useJourney() {
  const snapshot = useSyncExternalStore(subscribeJourney, getJourneySnapshot, getJourneySnapshot)
  const manifest = useMemo(() => loadRomeTourManifest(), [])
  const currentStop = useMemo(
    () => getCurrentStop(manifest, snapshot.context),
    [manifest, snapshot.context]
  )

  return {
    state: snapshot.state,
    context: snapshot.context,
    manifest,
    currentStop,
    states: JOURNEY_STATES,
    setState: setJourneyState,
    updateContext: updateJourneyContext,
    reset: resetJourney,
  }
}

export { JOURNEY_STATES }
