import { useEffect, useState, useSyncExternalStore } from 'react'
import {
  getJourneySnapshot,
  subscribeJourney,
  transitionJourney,
  resetJourney,
  beginJourney,
  markWaypointComplete,
  advanceWaypointIndex,
  advanceSequenceIndex,
  setJourneyPath,
  markTransitComplete,
  setActiveWaypointIndex,
  promoteOptionalWaypoint,
  completeStoryAfterThreshold,
  completeWaypointAndAdvance,
  continueFromDayComplete,
  jumpToSequenceIndex,
  setCustomWaypointIds,
  setJourneyPace,
  isResumableJourney,
  resumeJourney,
  prepareResumeCueIfNeeded,
  clearPendingResumeCue,
  JOURNEY_STATES,
} from '../state/journey'
import { clearRomeManifestCache, loadRomeManifest } from '../content/manifest.js'
import { DEV_GEOFENCES_CHANGED } from '../content/devGeofenceTools.js'
import { LOCALE_CHANGED_EVENT } from '../i18n/storage.js'

export function useV2Journey() {
  const snapshot = useSyncExternalStore(subscribeJourney, getJourneySnapshot, getJourneySnapshot)

  return {
    ...snapshot,
    states: JOURNEY_STATES,
    isResumable: isResumableJourney(snapshot),
    transition: transitionJourney,
    reset: resetJourney,
    begin: beginJourney,
    resume: resumeJourney,
    prepareResumeCue: prepareResumeCueIfNeeded,
    clearPendingResumeCue,
    completeWaypoint: markWaypointComplete,
    setWaypointIndex: advanceWaypointIndex,
    advanceSequence: advanceSequenceIndex,
    setPath: setJourneyPath,
    completeTransit: markTransitComplete,
    setActiveWaypoint: setActiveWaypointIndex,
    promoteOptional: promoteOptionalWaypoint,
    completeStoryAfterThreshold,
    completeWaypointAndAdvance,
    continueFromDayComplete,
    jumpToSequence: jumpToSequenceIndex,
    setCustomWaypointIds,
    setJourneyPace,
  }
}

export function useTourManifest() {
  const [manifest, setManifest] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    const load = () => {
      try {
        clearRomeManifestCache()
        const data = loadRomeManifest()
        if (!cancelled) {
          setError(null)
          setManifest(data)
        }
      } catch (err) {
        if (!cancelled) setError(err)
      }
    }

    load()
    const onReload = () => load()
    window.addEventListener(DEV_GEOFENCES_CHANGED, onReload)
    window.addEventListener(LOCALE_CHANGED_EVENT, onReload)
    return () => {
      cancelled = true
      window.removeEventListener(DEV_GEOFENCES_CHANGED, onReload)
      window.removeEventListener(LOCALE_CHANGED_EVENT, onReload)
    }
  }, [])

  return { manifest, error, loading: !manifest && !error }
}
