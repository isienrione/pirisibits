import { useCallback, useEffect, useState } from 'react'
import {
  getAnalyticsConsent,
  setAnalyticsConsent,
  subscribeAnalyticsConsent,
} from '../../lib/track.js'

/**
 * React binding for ChronoWalk marketing cookie preference.
 * Does not clear access, offline packs, journey progress, or app preferences.
 * Does not gate PostHog product analytics.
 */
export function useAnalyticsConsent() {
  const [consent, setConsent] = useState(() => getAnalyticsConsent())

  useEffect(() => {
    return subscribeAnalyticsConsent((value) => {
      setConsent(value)
    })
  }, [])

  const accept = useCallback(() => {
    setAnalyticsConsent(true)
    setConsent(getAnalyticsConsent())
  }, [])

  const decline = useCallback(() => {
    setAnalyticsConsent(false)
    setConsent(getAnalyticsConsent())
  }, [])

  return {
    consent,
    isUnknown: consent == null,
    isAccepted: consent === 'accepted',
    isDeclined: consent === 'declined',
    accept,
    decline,
  }
}
