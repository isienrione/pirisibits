import { useMemo } from 'react'
import { actAccentValue } from '../design/actAccents.ts'
import { resolveJourneyStep } from '../content/manifest.js'
import { getActForWaypoint } from '../data/romePacing.js'
import { useV2Journey, useTourManifest } from './useV2Journey.js'

/**
 * Returns the current journey act's accent as a CSS `var(...)` value.
 * Components should consume this hook - never hardcode an act accent.
 */
export function useActAccent() {
  const { context } = useV2Journey()
  const { manifest } = useTourManifest()

  return useMemo(() => {
    if (!manifest) return actAccentValue('act3')

    const step = resolveJourneyStep(
      manifest,
      context.path,
      context.currentSequenceIndex,
      context.promotedOptionalIds,
      context,
    )

    if (step.done) return actAccentValue('encore')

    const waypointId =
      step.type === 'waypoint' ? step.id : step.targetWaypoint?.id ?? step.record?.after

    const act = waypointId ? getActForWaypoint(waypointId) : null
    return actAccentValue(act?.id)
  }, [
    manifest,
    context.path,
    context.currentSequenceIndex,
    context.promotedOptionalIds,
    context.pace,
    context.customWaypointIds,
  ])
}

export default useActAccent
