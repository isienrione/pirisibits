import { Navigate } from 'react-router-dom'
import { hasAccess } from './config.js'

/** Gate paid tour surfaces — send locked visitors to restore access. */
export function RequireAccess({ children, redirectTo = '/access' }) {
  if (!hasAccess()) {
    return <Navigate to={redirectTo} replace />
  }
  return children
}
