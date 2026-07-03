import { Navigate } from 'react-router-dom'
import BeginFlow from '../../components/begin/BeginFlow'
import { hasAccess } from '../../lib/config'

export function BeginPage() {
  if (!hasAccess()) {
    return <Navigate to="/landing" replace />
  }

  return <BeginFlow />
}
