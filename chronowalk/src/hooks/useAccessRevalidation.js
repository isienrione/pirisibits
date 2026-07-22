import { useEffect } from 'react'
import { validateDeviceAccess } from '../lib/access.js'
import { hasValidLocalAccess, readDeviceCredential } from '../lib/accessSession.js'

/**
 * While online, revalidate the device credential on app startup, foreground,
 * and network reconnection. Clears local access when the server rejects.
 */
export function useAccessRevalidation() {
  useEffect(() => {
    let cancelled = false

    async function revalidate(reason) {
      if (!readDeviceCredential()) return
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        // Offline: lease gate is enforced by hasAccess(); do not clear yet.
        if (!hasValidLocalAccess()) return
        return
      }
      const result = await validateDeviceAccess()
      if (cancelled) return
      if (!result.ok && import.meta.env.DEV) {
        console.info('[access] revalidation cleared local access', reason, result.reason)
      }
    }

    void revalidate('startup')

    const onVisible = () => {
      if (document.visibilityState === 'visible') void revalidate('foreground')
    }
    const onOnline = () => void revalidate('online')

    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', onOnline)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', onOnline)
    }
  }, [])
}
