import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { hasAccess } from './config.js'
import { validateDeviceAccess } from './access.js'
import { hasValidLocalAccess } from './accessSession.js'

/**
 * Gate paid tour surfaces.
 * Uses credential + entitlement (with offline lease), not a bare boolean.
 * While online, revalidates on mount; clears access when server rejects.
 */
export function RequireAccess({ children, redirectTo = '/access' }) {
  const [allowed, setAllowed] = useState(() => hasValidLocalAccess())
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!hasValidLocalAccess()) {
        if (!cancelled) {
          setAllowed(false)
          setChecking(false)
        }
        return
      }

      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        if (!cancelled) {
          setAllowed(true)
          setChecking(false)
        }
        return
      }

      const result = await validateDeviceAccess()
      if (cancelled) return
      setAllowed(Boolean(result.ok))
      setChecking(false)
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [])

  if (checking) {
    if (!hasAccess()) {
      return <Navigate to={redirectTo} replace />
    }
    return children
  }

  if (!allowed) {
    return <Navigate to={redirectTo} replace />
  }

  return children
}
