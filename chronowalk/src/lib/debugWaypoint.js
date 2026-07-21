import { buildEffectiveSequence } from '../content/optionalPromotion.js'

const SLUG_ALIASES = {
  colosseum: 'w01',
  'colosseum-interior': 'w02',
  'arch-of-titus': 'w03',
  'arch-titus': 'w03',
  palatine: 'w04',
  'palatine-hill': 'w04',
  'basilica-of-maxentius': 'w06',
  'via-sacra': 'w07',
  'temple-of-vesta': 'w08',
  pause: 'pause',
  'forum-rest': 'pause',
  quinoa: 'pause',
  rostra: 'w10',
  bidasoa: 'w11_12',
  'heart-of-the-forum': 'w11_12',
  'capitoline-hill': 'w13',
  capitoline: 'w13',
  'trajans-market': 'w14',
  'trajan-market': 'w14',
  'spanish-steps': 'w15',
  'fontana-di-trevi': 'w16',
  trevi: 'w16',
  pantheon: 'w17',
  'pantheon-exterior': 'w17',
  'pantheon-interior': 'w23',
  'circus-maximus': 'enc_circus',
  'circus-maximus-view': 'enc_circus',
  circus: 'enc_circus',
  'piazza-navona': 'w18',
  navona: 'w18',
  'campo-de-fiori': 'w19',
  'largo-argentina': 'w20',
  argentina: 'w20',
  'castel-sant-angelo': 'w21',
  castel: 'w21',
  'via-appia': 'w22',
  'via-appia-antica': 'w22',
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
    const photo = normalizeSlug(waypoint.photo ?? '')
    return id === slug || title.includes(slug.replace(/-/g, ' ')) || photo.includes(slug)
  })

  return fromWaypoints?.id ?? null
}

export function findSequenceIndexForWaypoint(manifest, waypointId, path = 'a', promotedOptionalIds = []) {
  if (!manifest || !waypointId) return -1
  const sequence = buildEffectiveSequence(manifest, path, promotedOptionalIds)
  return sequence.indexOf(waypointId)
}
