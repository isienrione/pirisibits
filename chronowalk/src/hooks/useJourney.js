import { useEffect, useState, useSyncExternalStore } from 'react'
import {
  getJourneySnapshot,
  subscribeJourney,
  transitionJourney,
  resetJourney,
  beginJourney,
  markWaypointComplete,
  advanceWaypointIndex,
  JOURNEY_STATES,
} from '../state/journey'

export function useJourney() {
  const snapshot = useSyncExternalStore(subscribeJourney, getJourneySnapshot, getJourneySnapshot)

  return {
    ...snapshot,
    states: JOURNEY_STATES,
    transition: transitionJourney,
    reset: resetJourney,
    begin: beginJourney,
    completeWaypoint: markWaypointComplete,
    setWaypointIndex: advanceWaypointIndex,
  }
}

export function useTourManifest() {
  const [manifest, setManifest] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    import('../lib/tour')
      .then(({ loadTourManifest }) => loadTourManifest())
      .then((data) => {
        if (!cancelled) setManifest(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { manifest, error, loading: !manifest && !error }
}
