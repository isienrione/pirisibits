/**
 * Gate 2E.2A — map RouteRequest to TravelerModel for V0.2 diagnostic scoring.
 */

import type { RouteRequestV01 } from '@/src/engine/routes/route-types'
import type { TravelerModel } from '@/src/engine/types'

export function normalizeTravelerFromRouteRequest(request: RouteRequestV01): TravelerModel {
  return request.traveler
}
