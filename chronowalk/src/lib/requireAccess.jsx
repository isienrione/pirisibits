import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { hasAccess } from './config.js'
import { validateDeviceAccess, readDeviceCredential } from './access.js'
import { hasValidLocalAccess, readAccessEntitlement, writeAccessEntitlement } from './accessSession.js'

/**
 * Gate paid tour surfaces.
 * Uses credential + entitlement (with offline lease), not a bare boolean.
 * While online, revalidates on mount; clears access when server rejects.
 * Soft grace: if a credential exists but the lease just expired, allow the
 * shell to paint while revalidation runs (avoids Home Screen → paste-code flash).
 */
export function RequireAccess({ children, redirectTo = '/access' }) {
  const [allowed, setAllowed] = useState(() => hasValidLocalAccess() || Boolean(readDeviceCredential()))
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function run() {
      const credential = readDeviceCredential()
      if (!credential) {
        if (!cancelled) {
          setAllowed(false)
          setChecking(false)
        }
        return
      }

      if (hasValidLocalAccess() && typeof navigator !== 'undefined' && navigator.onLine === false) {
        if (!cancelled) {
          setAllowed(true)
          setChecking(false)
        }
        return
      }

      const result = await validateDeviceAccess()
      if (cancelled) return

      if (result.ok) {
        setAllowed(true)
        setChecking(false)
        return
      }

      // Network blip with an existing (even slightly stale) entitlement: keep walking.
      const entitlement = readAccessEntitlement()
      if (result.reason === 'network' && entitlement && credential) {
        writeAccessEntitlement(entitlement)
        setAllowed(true)
        setChecking(false)
        return
      }

      setAllowed(false)
      setChecking(false)
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [])

  if (checking) {
    if (!hasAccess() && !readDeviceCredential()) {
      return <Navigate to={redirectTo} replace />
    }
    return children
  }

  if (!allowed) {
    return <Navigate to={redirectTo} replace />
  }

  return children
}
