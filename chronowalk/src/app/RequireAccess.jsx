import { Navigate, useLocation } from 'react-router-dom'
import { hasAccess } from '../lib/config.js'
import { readPendingPurchaseTier } from '../lib/pendingPurchase.js'

/**
 * Owner routes (setup, begin, tour, journey…) require a prior purchase unlock.
 * Unpaid visitors are sent to /purchase — never into the walk for free.
 */
export default function RequireAccess({ children }) {
  const location = useLocation()

  if (hasAccess()) {
    return children
  }

  const pendingTier = readPendingPurchaseTier()
  const search = pendingTier ? `?tier=${encodeURIComponent(pendingTier)}` : ''
  return (
    <Navigate
      to={`/purchase${search}`}
      replace
      state={{ from: location.pathname + location.search }}
    />
  )
}
