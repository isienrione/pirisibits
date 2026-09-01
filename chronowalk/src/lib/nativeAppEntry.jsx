import { useEffect, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import { hasValidLocalAccess } from './accessSession.js'
import { hasCompletedGuestOnboarding, hasGuestSession } from './guestSession.js'
import { isNativeIOS } from './platform.js'
import { track, TRACK_EVENTS } from './track.js'
import { getActiveRoute } from './route/store.js'
import { isRouteLive } from './route/model.js'

/**
 * Native iOS boot destination for the root path only.
 * Web returns null so "/" stays the marketing landing.
 *
 * Entitlement uses the same local session RequireAccess uses
 * (`hasValidLocalAccess`) — never a hard-coded grant.
 * Guest onboarding is local `cw_guest_v1`, not a paid credential.
 */
export function resolveNativeRootEntry() {
  if (!isNativeIOS()) return { path: null, reason: 'web' }
  if (hasValidLocalAccess() || hasCompletedGuestOnboarding()) {
    const active = getActiveRoute()
    if (isRouteLive(active)) {
      return { path: '/route', reason: active.status === 'paused' ? 'resume' : 'active-route' }
    }
    return { path: '/home', reason: hasValidLocalAccess() ? 'entitled' : 'guest' }
  }
  if (hasGuestSession()) return { path: '/context', reason: 'context' }
  return { path: '/welcome', reason: 'first-run' }
}

export function getNativeRootRedirect() {
  return resolveNativeRootEntry().path
}

/** Native guest may enter app-shell routes without a paid credential. */
export function canEnterNativeGuestShell({ onboarded = false } = {}) {
  if (!isNativeIOS()) return false
  if (onboarded) return hasCompletedGuestOnboarding()
  return hasGuestSession()
}

/** Native iOS binaries are already installed; skip A2HS / Safari install UI. */
export function shouldSkipNativeA2hs() {
  return isNativeIOS()
}

/**
 * Render-time gate for `/`. Native iOS never mounts the marketing landing,
 * so there is no one-frame flash before redirect.
 */
export function NativePublicLandingRoute({ children }) {
  const entry = resolveNativeRootEntry()
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return
    if (entry.reason === 'guest') {
      tracked.current = true
      track(TRACK_EVENTS.NATIVE_GUEST_RETURNED)
    }
  }, [entry.reason])

  if (entry.path) {
    return <Navigate to={entry.path} replace />
  }
  return children
}
