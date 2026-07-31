import { Navigate } from 'react-router-dom'
import { hasAccess } from '../../lib/config'

import RedesignBeginFlow from '../../redesign/RedesignBeginFlow.jsx'

export function BeginPage() {
  if (!hasAccess()) {
    return <Navigate to="/" replace />
  }

  return <RedesignBeginFlow />
}
