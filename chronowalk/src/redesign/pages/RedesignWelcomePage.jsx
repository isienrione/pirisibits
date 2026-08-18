import { Navigate } from 'react-router-dom'
import { hasValidLocalAccess } from '../../lib/accessSession.js'
import { hasCompletedGuestOnboarding, hasGuestSession } from '../../lib/guestSession.js'
import { isNativeIOS } from '../../lib/platform.js'
import NativeWelcomeScreen from '../screens/NativeWelcomeScreen.jsx'

/**
 * Web `/welcome` stays a silent hop into existing setup.
 * Native first-run paints the Welcome entrance; returning guests and
 * entitled travelers skip it. Incomplete Context resumes at /context.
 */
export default function RedesignWelcomePage() {
  if (isNativeIOS()) {
    if (hasValidLocalAccess() || hasCompletedGuestOnboarding()) {
      return <Navigate to="/home" replace />
    }
    if (hasGuestSession()) {
      return <Navigate to="/context" replace />
    }
    return <NativeWelcomeScreen />
  }

  return <Navigate to="/setup" replace />
}
