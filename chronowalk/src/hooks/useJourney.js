import { useCallback, useMemo, useSyncExternalStore } from 'react'
import {
  JOURNEY_STATES,
  getJourneySnapshot,
  resetJourney,
  setJourneyState,
  subscribeJourney,
  updateJourneyContext,
} from '../state/journeyState'
import {
  estimateDistanceBetweenStops,
  getNextStop,
  isLastStop,
  planContinueWalking,
} from '../content/journeyProgress'
import { getCurrentStop, loadRomeTourManifest } from '../content/romeTourManifest'

export function useJourney() {
  const snapshot = useSyncExternalStore(subscribeJourney, getJourneySnapshot, getJourneySnapshot)
  const manifest = useMemo(() => loadRomeTourManifest(), [])
  const currentStop = useMemo(
    () => getCurrentStop(manifest, snapshot.context),
    [manifest, snapshot.context]
  )
  const nextStop = useMemo(
    () => getNextStop(manifest, currentStop),
    [manifest, currentStop]
  )
  const distanceToNextM = useMemo(
    () => estimateDistanceBetweenStops(currentStop, nextStop),
    [currentStop, nextStop]
  )
  const lastStop = useMemo(
    () => isLastStop(manifest, currentStop),
    [manifest, currentStop]
  )

  const continueWalking = useCallback(() => {
    const plan = planContinueWalking(manifest, snapshot.context, currentStop)
    if (!plan.ok) return plan

    if (plan.isComplete) {
      updateJourneyContext(plan.nextContext)
      setJourneyState(JOURNEY_STATES.COMPLETE)
      if (typeof window !== 'undefined') {
        window.location.assign('/complete')
      }
      return plan
    }

    updateJourneyContext(plan.nextContext)
    setJourneyState(JOURNEY_STATES.WALKING)
    if (typeof window !== 'undefined') {
      window.location.assign('/journey')
    }
    return plan
  }, [manifest, snapshot.context, currentStop])

  return {
    state: snapshot.state,
    context: snapshot.context,
    manifest,
    currentStop,
    nextStop,
    distanceToNextM,
    isLastStop: lastStop,
    states: JOURNEY_STATES,
    setState: setJourneyState,
    updateContext: updateJourneyContext,
    reset: resetJourney,
    continueWalking,
  }
}

export { JOURNEY_STATES }
