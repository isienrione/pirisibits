import { useMemo } from 'react'
import { resolveJourneyStep } from '../content/manifest.js'

export function useJourneyStep(manifest, path, sequenceIndex, promotedOptionalIds = [], context = null) {
  const pace = context?.pace ?? null
  const customKey = Array.isArray(context?.customWaypointIds)
    ? context.customWaypointIds.join(',')
    : ''
  return useMemo(() => {
    if (!manifest) return null
    return resolveJourneyStep(manifest, path, sequenceIndex, promotedOptionalIds, context)
  }, [manifest, path, promotedOptionalIds, sequenceIndex, pace, customKey, context])
}
