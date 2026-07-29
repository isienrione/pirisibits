import { z } from 'zod'
import { nowImageSchema, validateNowImageSemantics } from './nowImage.schema.js'

const geofenceSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  radius_m: z.number().positive(),
})

const reconstructionSchema = z.object({
  now: z.string(),
  then: z.string(),
  loop: z.string().optional(),
  caption: z.string().optional(),
})

const waypointDisplaySchema = z.object({
  publicPlaceCount: z.number().int().positive().optional(),
  combinedLabel: z.string().optional(),
})

const chapterSchema = z.union([
  z.string(),
  z.object({
    file: z.string(),
    title: z.string().optional(),
    transcript: z.string().optional(),
    /** Optional static hero for chapter (used when threshold is off). */
    photo: z.string().optional(),
    /** Optional override for combined stops (e.g. Severus + Curia). */
    reconstruction: reconstructionSchema.optional(),
  }),
])

const variantMetaSchema = z.object({
  title: z.string().optional(),
  transcript: z.string().optional(),
})

const waypointSchema = z.object({
  title: z.string(),
  act: z.string(),
  geofence: geofenceSchema,
  zone: z.string(),
  chapters: z.array(chapterSchema).min(1),
  transcript: z.string().optional(),
  inserts: z.array(z.string()).optional(),
  alt_inserts: z.array(z.string()).optional(),
  outro_variants: z.record(z.string(), z.string()).optional(),
  outro_title: z.string().optional(),
  interior_zone: z.string().optional(),
  optional_on_path: z.enum(['a', 'b']).optional(),
  scripted_rest: z.boolean().optional(),
  display: waypointDisplaySchema.optional(),
  photo: z.string().optional(),
  now_image: nowImageSchema.optional(),
  reconstruction: reconstructionSchema.optional(),
  /** Explicitly disable then/now threshold (static photo stops). */
  threshold: z.boolean().optional(),
  approachLine: z.string().optional(),
  arrivalLine: z.string().optional(),
})

const transitSchema = z.object({
  after: z.string().optional(),
  audio: z.string().optional(),
  title: z.string().optional(),
  transcript: z.string().optional(),
  zone: z.string().optional(),
  variants: z.record(z.string(), z.string()).optional(),
  variant_meta: z.record(z.string(), variantMetaSchema).optional(),
  choice: z.boolean().optional(),
  duration_s: z.number().optional(),
  note: z.string().optional(),
  travel_mode: z.enum(['walk', 'ride']).optional(),
  eta_label: z.string().optional(),
})

const insertSchema = z.object({
  audio: z.string(),
  title: z.string().optional(),
  transcript: z.string().optional(),
  requires: z.array(z.string()).optional(),
  requiresAny: z.array(z.string()).optional(),
  requiresHeard: z.array(z.string()).optional(),
  playIfMissing: z.array(z.string()).optional(),
})

const actSchema = z.object({
  id: z.string(),
  numeral: z.string(),
  title: z.string(),
  waypoints: z.array(z.string()).min(1),
})

const productSchema = z.object({
  publicPlaceCount: z.number().int().positive(),
  visitStopCount: z.number().int().positive().optional(),
  classicVisitStopCount: z.number().int().positive().optional(),
  storyStopCount: z.number().int().positive().optional(),
  actCount: z.number().int().positive().optional(),
  durationLabel: z.string().optional(),
  ownershipLabel: z.string().optional(),
  distanceLabel: z.string().optional(),
  priceFallbackCents: z.number().int().positive().optional(),
  currency: z.string().optional(),
})

export const romeManifestSchema = z.object({
  city: z.literal('rome'),
  id: z.string(),
  name: z.string(),
  accent: z.string().optional(),
  price_fallback_cents: z.number().optional(),
  product: productSchema.optional(),
  reflections: z.array(z.string()).optional(),
  acts: z.array(actSchema).min(1),
  journey: z.object({
    paths: z.array(z.enum(['a', 'b'])).min(1),
    default_path: z.enum(['a', 'b']),
    path_reorder: z.record(z.string(), z.array(z.string())),
    sequences: z.record(z.string(), z.array(z.string())),
    optional_waypoints: z.record(z.string(), z.array(z.string())).optional(),
  }),
  waypoints: z.record(z.string(), waypointSchema),
  transits: z.record(z.string(), transitSchema),
  inserts: z.record(z.string(), insertSchema),
  beds: z.record(z.string(), z.string()),
  system: z.object({
    presence: z.string(),
    longwalk: z.string(),
    no_ticket: z.array(z.string()),
    ui: z.record(z.string(), z.string()),
    preview: z.string().optional(),
    resume: z.record(z.string(), z.string()).optional(),
    threshold_ambience: z
      .object({
        now: z.string(),
        then: z.string(),
      })
      .optional(),
  }),
  durations: z.record(z.string(), z.number()),
})

function actWaypointSet(acts, actId) {
  return new Set(acts.find((act) => act.id === actId)?.waypoints ?? [])
}

export function validateManifestSemantics(manifest) {
  const errors = []
  const waypointIds = new Set(Object.keys(manifest.waypoints))
  const transitIds = new Set(Object.keys(manifest.transits))
  const insertIds = new Set(Object.keys(manifest.inserts))
  const bedKeys = new Set(Object.keys(manifest.beds))

  for (const [id, waypoint] of Object.entries(manifest.waypoints)) {
    if (!bedKeys.has(waypoint.zone)) {
      errors.push(`waypoint ${id}: zone "${waypoint.zone}" is not a defined bed key`)
    }
    if (waypoint.interior_zone && !bedKeys.has(waypoint.interior_zone)) {
      errors.push(`waypoint ${id}: interior_zone "${waypoint.interior_zone}" is not a defined bed key`)
    }
    for (const insertId of waypoint.inserts ?? []) {
      if (!insertIds.has(insertId)) {
        errors.push(`waypoint ${id}: unknown insert "${insertId}"`)
      }
    }
    for (const insertId of waypoint.alt_inserts ?? []) {
      if (!insertIds.has(insertId)) {
        errors.push(`waypoint ${id}: unknown alt_insert "${insertId}"`)
      }
    }
    if (!manifest.acts.some((act) => act.waypoints.includes(id))) {
      errors.push(`waypoint ${id} is not listed in any act`)
    }
    validateNowImageSemantics(id, waypoint.now_image, errors)
  }

  for (const [id, insert] of Object.entries(manifest.inserts)) {
    const refs = [...(insert.requires ?? []), ...(insert.requiresAny ?? []), ...(insert.playIfMissing ?? [])]
    for (const ref of refs) {
      if (!waypointIds.has(ref)) {
        errors.push(`insert ${id}: unknown waypoint reference "${ref}"`)
      }
    }
    for (const heard of insert.requiresHeard ?? []) {
      if (!transitIds.has(heard) && !waypointIds.has(heard)) {
        errors.push(`insert ${id}: unknown requiresHeard reference "${heard}"`)
      }
    }
  }

  const act2 = manifest.acts.find((act) => act.id === 'act2')
  const act2Waypoints = actWaypointSet(manifest.acts, 'act2')
  for (const [path, reorder] of Object.entries(manifest.journey.path_reorder)) {
    for (const waypointId of reorder) {
      if (!act2Waypoints.has(waypointId)) {
        errors.push(`path_reorder.${path}: waypoint "${waypointId}" is not in act2`)
      }
    }
  }

  for (const [path, sequence] of Object.entries(manifest.journey.sequences)) {
    for (const stepId of sequence) {
      if (!waypointIds.has(stepId) && !transitIds.has(stepId)) {
        errors.push(`journey.sequences.${path}: unknown step "${stepId}"`)
      }
    }
  }

  if (errors.length) {
    throw new Error(errors.join('\n'))
  }

  return manifest
}

export function parseRomeManifest(raw) {
  const parsed = romeManifestSchema.parse(raw)
  return validateManifestSemantics(parsed)
}
