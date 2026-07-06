import { useEffect, useRef } from 'react'
import { getDebugStopId, shouldResetTour } from '../config/env.js'
import { findSequenceIndexForWaypoint, resolveDebugWaypointId } from '../lib/debugWaypoint.js'
import { JOURNEY_STATES } from '../state/journey.js'
import { useV2Journey, useTourManifest } from './useV2Journey.js'

/** Applies ?resetTour=true and ?debugStop=colosseum to the v2 journey once manifest loads. */
export function useTourDebugBootstrap() {
  const { manifest } = useTourManifest()
  const { state, context, begin, jumpToSequence, reset } = useV2Journey()
  const appliedRef = useRef(false)

  useEffect(() => {
    if (!manifest || appliedRef.current) return

    if (shouldResetTour()) {
      reset()
    }

    const debugStop = getDebugStopId()
    if (!debugStop) {
      appliedRef.current = true
      return
    }

    const waypointId = resolveDebugWaypointId(debugStop, manifest)
    const path = context.path || manifest.journey?.default_path || 'a'
    const sequenceIndex = findSequenceIndexForWaypoint(
      manifest,
      waypointId,
      path,
      context.promotedOptionalIds,
    )

    if (sequenceIndex < 0) {
      appliedRef.current = true
      return
    }

    if (state === JOURNEY_STATES.IDLE || state === JOURNEY_STATES.COMPLETE) {
      begin({ pace: context.pace || 'classic', path, waypointIndex: 0 })
    }

    jumpToSequence(sequenceIndex)
    appliedRef.current = true
  }, [begin, context.path, context.pace, context.promotedOptionalIds, jumpToSequence, manifest, reset, state])
}
