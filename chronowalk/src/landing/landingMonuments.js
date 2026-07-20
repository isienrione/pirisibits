import { getModernPosterThumbUrl } from '../content/modernPhotoRegistry.js'
import { LANDING_ROUTE_STOPS, LANDING_TIER_ROUTES } from './landingTierRoutes.js'

/** All monuments on the complete Rome route — for landing carousel. */
export function getLandingMonuments() {
  const stopIds = LANDING_TIER_ROUTES['rome-complete'] ?? []

  return stopIds.map((id) => {
    const stop = LANDING_ROUTE_STOPS[id]
    return {
      id,
      title: stop?.title ?? id,
      short: stop?.short ?? stop?.title ?? id,
      photo: getModernPosterThumbUrl(id),
    }
  })
}
