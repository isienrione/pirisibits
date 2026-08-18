import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { hasAccess } from './config.js'
import { validateDeviceAccess, readDeviceCredential } from './access.js'
import { hasValidLocalAccess, readAccessEntitlement, writeAccessEntitlement } from './accessSession.js'
import { consumeAccessHandoff, syncAccessHandoff } from './accessHandoff.js'
import { claimFamilySeat, readLastBundleInviteCode } from './familyWalk.js'
import { hasCompletedGuestOnboarding, hasGuestSession } from './guestSession.js'
import { isNativeIOS } from './platform.js'

/**
 * Gate paid tour surfaces.
 * Uses credential + entitlement (with offline lease), not a bare boolean.
 * While online, revalidates on mount; clears access when server rejects.
 * Soft grace: if a credential exists but the lease just expired, allow the
 * shell to paint while revalidation runs (avoids Home Screen → paste-code flash).
 * Home Screen relaunches: if access is missing, try auto-redeeming the last
 * `/invite?code=` before redirecting to `/access`.
 */
export function RequireAccess({ children, redirectTo = '/access' }) {
  const [allowed, setAllowed] = useState(
    () => hasValidLocalAccess() || Boolean(readDeviceCredential()) || consumeAccessHandoff(),
  )
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function run() {
      consumeAccessHandoff()
      let credential = readDeviceCredential()

      // Home Screen / shortcut relaunches might not preserve URL parameters.
      // If we've previously seen an `/invite?code=...` flow, try to redeem
      // that last code automatically (only online) before bouncing to /access.
      if (!credential && !hasValidLocalAccess()) {
        if (typeof navigator !== 'undefined' && navigator.onLine !== false) {
          const inviteCode = readLastBundleInviteCode()
          if (inviteCode) {
            try {
              await claimFamilySeat({ inviteCode, displayName: 'Walker' })
              credential = readDeviceCredential()
              if (!cancelled && (hasValidLocalAccess() || credential)) {
                setAllowed(true)
                setChecking(false)
                return
              }
            } catch {
              // Fall through to normal access prompt.
            }
          }
        }
      }

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
        syncAccessHandoff({ updateUrl: false })
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
    // Soft paint when we already have a credential/lease.
    if (hasAccess() || readDeviceCredential() || hasValidLocalAccess()) {
      return children
    }
    // Native guests must not sit on a blank gate, and must not be sent to
    // the access-code screen when they tap a paid surface.
    if (isNativeIOS() && hasCompletedGuestOnboarding()) {
      return <Navigate to="/home" replace />
    }
    // Wait for invite auto-redeem / revalidation before bouncing to /access
    // (avoids Home Screen → paste-code flash).
    return null
  }

  if (!allowed) {
    if (isNativeIOS() && hasCompletedGuestOnboarding()) {
      return <Navigate to="/home" replace />
    }
    return <Navigate to={redirectTo} replace />
  }

  return children
}

/**
 * App-shell gate: paid travelers OR native guests.
 * Web without a credential still goes to /access (marketing/PWA unchanged).
 *
 * @param {{ children: import('react').ReactNode, requireOnboardedGuest?: boolean }} props
 */
export function RequireAppShell({ children, requireOnboardedGuest = false }) {
  if (hasValidLocalAccess() || readDeviceCredential()) {
    return <RequireAccess>{children}</RequireAccess>
  }

  if (isNativeIOS()) {
    const guestOk = requireOnboardedGuest ? hasCompletedGuestOnboarding() : hasGuestSession()
    if (guestOk) return children
    return <Navigate to="/welcome" replace />
  }

  return <Navigate to="/access" replace />
}
