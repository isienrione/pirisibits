/**
 * Build Asset Studio URLs — prompts UI for AI asset production.
 * Pattern: ?assetStudio=true&waypoint=<id>
 */
import { ROME_CORE_TOUR } from '../data/rome-core-tour'
import { getWaypointGeo } from '../data/waypointGeo'

export const ASSET_STUDIO_PARAM = 'assetStudio'
export const ASSET_STUDIO_WAYPOINT_PARAM = 'waypoint'

/** Query string only, e.g. ?assetStudio=true&waypoint=pantheon */
export const buildAssetStudioSearch = (waypointId) => {
  const params = new URLSearchParams({
    [ASSET_STUDIO_PARAM]: 'true',
    [ASSET_STUDIO_WAYPOINT_PARAM]: waypointId,
  })
  return `?${params.toString()}`
}

/** Full URL for a given origin (defaults to relative path for same-host). */
export const buildAssetStudioUrl = (waypointId, origin = '') => {
  const search = buildAssetStudioSearch(waypointId)
  if (!origin) return search

  const base = String(origin).replace(/\/$/, '')
  return `${base}/${search}`.replace(/\/\?/, '?').replace(/([^/])\?/, '$1/?')
}

export const listAssetStudioEntries = (tour = ROME_CORE_TOUR) =>
  (tour?.stopIds ?? []).map((id) => {
    const geo = getWaypointGeo(id)
    return {
      id,
      title: geo?.title ?? id,
      search: buildAssetStudioSearch(id),
      localDevUrl: buildAssetStudioUrl(id, 'http://localhost:5173'),
    }
  })
