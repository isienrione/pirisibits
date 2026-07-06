import { buildEffectiveSequence } from '../content/optionalPromotion.js'

const SLUG_ALIASES = {
  colosseum: 'w01',
  pantheon: 'w03',
  'piazza-navona': 'w06',
  'capitoline-hill': 'w02',
  'largo-argentina': 'w04',
  'campo-de-fiori': 'w05',
  'castel-sant-angelo': 'w07',
  'fontana-di-trevi': 'w08',
}

function normalizeSlug(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
}

/** Map legacy slugs (colosseum) or manifest ids (w01) to a manifest waypoint id. */
export function resolveDebugWaypointId(rawId, manifest) {
  if (!rawId || !manifest) return null

  if (manifest.waypointsById?.[rawId]) return rawId

  const slug = normalizeSlug(rawId)
  if (SLUG_ALIASES[slug]) return SLUG_ALIASES[slug]

  const fromWaypoints = manifest.waypoints?.find((waypoint) => {
    const id = normalizeSlug(waypoint.id)
    const title = normalizeSlug(waypoint.title)
    const photo = normalizeSlug(waypoint.photo)
    return id === slug || title.includes(slug.replace(/-/g, ' ')) || photo.includes(slug)
  })

  return fromWaypoints?.id ?? null
}

export function findSequenceIndexForWaypoint(manifest, waypointId, path = 'a', promotedOptionalIds = []) {
  if (!manifest || !waypointId) return -1
  const sequence = buildEffectiveSequence(manifest, path, promotedOptionalIds)
  return sequence.indexOf(waypointId)
}
