import { useMemo } from 'react'
import { actAccentPair } from '../design/actAccents.ts'
import { resolveJourneyStep } from '../content/manifest.js'
import { getActForWaypoint } from '../data/romePacing.js'
import { useV2Journey, useTourManifest } from './useV2Journey.js'

/**
 * Returns the current journey act's accent pair as CSS `var(...)` values.
 * Components should consume this hook — never hardcode an act accent.
 */
export function useActAccent() {
  const { context } = useV2Journey()
  const { manifest } = useTourManifest()

  return useMemo(() => {
    if (!manifest) return actAccentPair('act3')

    const step = resolveJourneyStep(
      manifest,
      context.path,
      context.currentSequenceIndex,
      context.promotedOptionalIds
    )

    if (step.done) return actAccentPair('encore')

    const waypointId =
      step.type === 'waypoint' ? step.id : step.targetWaypoint?.id ?? step.record?.after

    const act = waypointId ? getActForWaypoint(waypointId) : null
    return actAccentPair(act?.id)
  }, [
    manifest,
    context.path,
    context.currentSequenceIndex,
    context.promotedOptionalIds,
  ])
}

export default useActAccent
