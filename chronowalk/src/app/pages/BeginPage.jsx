import { Navigate } from 'react-router-dom'
import { hasAccess } from '../../lib/config'
import { canEnterNativeGuestShell } from '../../lib/nativeAppEntry.jsx'
import { isNativeIOS } from '../../lib/platform.js'

import RedesignBeginFlow from '../../redesign/RedesignBeginFlow.jsx'

export function BeginPage() {
  if (hasAccess() || canEnterNativeGuestShell()) {
    return <RedesignBeginFlow />
  }

  if (isNativeIOS()) {
    return <Navigate to="/welcome" replace />
  }

  return <Navigate to="/" replace />
}
