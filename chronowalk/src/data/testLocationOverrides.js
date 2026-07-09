/**
 * Dev-only geofence substitutes for field-testing GPS triggers outside Rome.
 *
 * Enable with ?testRegion=chile or VITE_TEST_LOCATION_REGION=chile
 *
 * Walk test (Las Condes, Santiago):
 * - w01 Colosseum → Teatro Municipal de Las Condes
 * - Forum act (w06–w13) → cluster around Plaza Perú
 * - w15 Spanish Steps → Apumanque
 */
import { getTestLocationRegion } from '../config/env.js'

/** ~39 m at Santiago latitude — spacing for forum-cluster test stops. */
const FORUM_OFFSET_DEG = 0.00035

const TEATRO_MUNICIPAL_LAS_CONDES = {
  lat: -33.41619,
  lng: -70.59582,
  label: 'Teatro Municipal de Las Condes (Colosseum stand-in)',
}

const PLAZA_PERU = {
  lat: -33.4148,
  lng: -70.59845,
  label: 'Plaza Perú (Forum stand-in)',
}

const APUMANQUE = {
  lat: -33.40972,
  lng: -70.5675,
  label: 'Apumanque (Spanish Steps stand-in)',
}

/** Manifest waypoint id → substitute geofence (Rome radius_m preserved when omitted). */
export const CHILE_MANIFEST_GEOFENCES = {
  w01: { ...TEATRO_MUNICIPAL_LAS_CONDES, radius_m: 45 },
  w02: { lat: -33.41612, lng: -70.59555, radius_m: 40, label: 'Teatro Municipal (interior stand-in)' },
  w03: { lat: -33.4155, lng: -70.5971, radius_m: 40, label: 'Between Teatro & Plaza Perú (Arch of Titus)' },
  w04: { lat: -33.4152, lng: -70.5978, radius_m: 50, label: 'Near Plaza Perú (Palatine stand-in)' },
  w06: {
    lat: PLAZA_PERU.lat + FORUM_OFFSET_DEG,
    lng: PLAZA_PERU.lng,
    radius_m: 40,
    label: 'Plaza Perú north (Basilica of Maxentius)',
  },
  w07: {
    lat: PLAZA_PERU.lat + FORUM_OFFSET_DEG * 0.7,
    lng: PLAZA_PERU.lng + FORUM_OFFSET_DEG * 0.7,
    radius_m: 40,
    label: 'Plaza Perú NE (Via Sacra)',
  },
  w08: {
    lat: PLAZA_PERU.lat,
    lng: PLAZA_PERU.lng + FORUM_OFFSET_DEG,
    radius_m: 35,
    label: 'Plaza Perú east (Temple of Vesta)',
  },
  pause: { ...PLAZA_PERU, radius_m: 80, label: 'Plaza Perú (Forum rest)' },
  w10: {
    lat: PLAZA_PERU.lat - FORUM_OFFSET_DEG,
    lng: PLAZA_PERU.lng,
    radius_m: 35,
    label: 'Plaza Perú south (Rostra)',
  },
  w11_12: {
    lat: PLAZA_PERU.lat - FORUM_OFFSET_DEG * 0.7,
    lng: PLAZA_PERU.lng - FORUM_OFFSET_DEG * 0.7,
    radius_m: 40,
    label: 'Plaza Perú SW (Heart of the Forum)',
  },
  w13: {
    lat: PLAZA_PERU.lat,
    lng: PLAZA_PERU.lng - FORUM_OFFSET_DEG,
    radius_m: 45,
    label: 'Plaza Perú west (Capitoline Hill)',
  },
  w14: { lat: -33.4142, lng: -70.5989, radius_m: 45, label: 'Near Plaza Perú (Trajan\'s Market)' },
  w15: { ...APUMANQUE, radius_m: 35 },
}

/** Legacy tour slugs → manifest id for shared Chile coords. */
const LEGACY_SLUG_TO_MANIFEST_ID = {
  colosseum: 'w01',
  'colosseum-interior': 'w02',
  'arch-of-titus': 'w03',
  'arch-titus': 'w03',
  palatine: 'w04',
  'palatine-hill': 'w04',
  'basilica-of-maxentius': 'w06',
  'via-sacra': 'w07',
  'temple-of-vesta': 'w08',
  'forum-rest': 'pause',
  rostra: 'w10',
  'heart-of-the-forum': 'w11_12',
  'capitoline-hill': 'w13',
  capitoline: 'w13',
  'trajans-market': 'w14',
  'trajan-market': 'w14',
  'spanish-steps': 'w15',
  'forum-basilica-maxentius': 'w06',
  'forum-via-sacra': 'w07',
  'forum-temple-vesta': 'w08',
  'forum-rostra': 'w10',
  'forum-temple-saturn': 'w11_12',
  'forum-curia-julia': 'w11_12',
  'forum-arch-severus': 'w11_12',
  'forum-arch-titus': 'w03',
}

export function isTestLocationOverrideActive() {
  return getTestLocationRegion() === 'chile'
}

export function getChileTestLocationSummary() {
  return [
    'Colosseum → Teatro Municipal de Las Condes',
    'Forum → Plaza Perú cluster',
    'Spanish Steps → Apumanque',
  ]
}

function resolveManifestId(waypointId) {
  if (!waypointId) return null
  if (CHILE_MANIFEST_GEOFENCES[waypointId]) return waypointId
  const slug = String(waypointId).trim().toLowerCase()
  return LEGACY_SLUG_TO_MANIFEST_ID[slug] ?? null
}

export function getChileGeofenceOverride(waypointId) {
  if (!isTestLocationOverrideActive()) return null
  const manifestId = resolveManifestId(waypointId)
  if (!manifestId) return null
  return CHILE_MANIFEST_GEOFENCES[manifestId] ?? null
}

export function applyGeofenceOverride(waypointId, geofence) {
  if (!geofence) return geofence
  const override = getChileGeofenceOverride(waypointId)
  if (!override) return geofence
  return {
    ...geofence,
    lat: override.lat,
    lng: override.lng,
    radius_m: override.radius_m ?? geofence.radius_m,
  }
}

export function applyWaypointGeoOverride(waypointId, geo) {
  if (!geo) return geo
  const override = getChileGeofenceOverride(waypointId)
  if (!override) return geo
  return {
    ...geo,
    landmark: { lat: override.lat, lng: override.lng },
    debugPosition: { lat: override.lat, lng: override.lng },
    geofenceThresholdM: override.radius_m ?? geo.geofenceThresholdM,
    testLocationLabel: override.label,
  }
}
