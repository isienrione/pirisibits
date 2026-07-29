import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { validateDeviceAccess } from './access.js'
import { hasValidLocalAccess } from './accessSession.js'
import { claimFamilySeat, readLastBundleInviteCode } from './familyWalk.js'

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
        // Home Screen / shortcut relaunches might not preserve URL parameters in
        // memory. If we've previously seen an `/invite?code=...` flow, try to
        // redeem that last code automatically (only online).
        if (typeof navigator !== 'undefined' && navigator.onLine !== false) {
          const inviteCode = readLastBundleInviteCode()
          if (inviteCode) {
            try {
              await claimFamilySeat({ inviteCode, displayName: 'Walker' })
              if (!cancelled) {
                setAllowed(true)
                setChecking(false)
              }
              return
            } catch {
              // Fall through to normal access prompt.
            }
          }
        }

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
    // Avoid redirecting until we've had a chance to auto-redeem an
    // `/invite?code=` we previously stored (e.g. Home Screen relaunch).
    return allowed ? children : null
  }

  if (!allowed) {
    return <Navigate to={redirectTo} replace />
  }

  return children
}
