import { Navigate } from 'react-router-dom'
import { hasValidLocalAccess } from './accessSession.js'
import { isNativeIOS } from './platform.js'

/**
 * Native iOS boot destination for the root path only.
 * Web returns null so "/" stays the marketing landing.
 *
 * Entitlement uses the same local session RequireAccess uses
 * (`hasValidLocalAccess`) — never a hard-coded grant.
 */
export function getNativeRootRedirect() {
  if (!isNativeIOS()) return null
  return hasValidLocalAccess() ? '/home' : '/access'
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
  const redirectTo = getNativeRootRedirect()
  if (redirectTo) {
    return <Navigate to={redirectTo} replace />
  }
  return children
}
