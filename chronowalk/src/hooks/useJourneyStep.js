import { useMemo } from 'react'
import { resolveJourneyStep } from '../content/manifest.js'

export function useJourneyStep(manifest, path, sequenceIndex) {
  return useMemo(() => {
    if (!manifest) return null
    return resolveJourneyStep(manifest, path, sequenceIndex)
  }, [manifest, path, sequenceIndex])
}
