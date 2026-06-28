import {
  AUDIO_ASSET_FIELDS,
  IMAGE_ASSET_FIELDS,
  STORES,
} from './idbSchema'
import {
  canonicalAssetUrl,
  inferMediaKind,
  serializeWaypointMetadata,
  toAbsoluteAssetUrl,
} from './cacheManifest'

function recordId(tourId, stopId) {
  return `${tourId}:${stopId}`
}

function transitId(tourId, fromId, toId) {
  return `${tourId}:${fromId}->${toId}`
}

function assetRecordId(tourId, stopId, field) {
  return `${tourId}:${stopId}:${field}`
}

function buildAssetReference({ tourId, stopId, field, sourceUrl, store }) {
  const absoluteUrl = toAbsoluteAssetUrl(sourceUrl)
  if (!absoluteUrl) return null

  return {
    id: assetRecordId(tourId, stopId, field),
    tourId,
    stopId,
    field,
    sourceUrl: absoluteUrl,
    cacheKey: canonicalAssetUrl(absoluteUrl),
    mediaKind: inferMediaKind(absoluteUrl),
    store,
  }
}

export function buildOfflineTourRecords({ tour, waypoints, manifest, status, downloadedAt = null, verifiedAt = null, error = null }) {
  const tourId = tour.id
  const geoByStopId = manifest?.geoByStopId ?? {}
  const legs = manifest?.legs ?? []

  const tourRecord = {
    tourId,
    title: tour.title,
    subtitle: tour.subtitle ?? null,
    stopIds: tour.stopIds ?? [],
    mapZoom: tour.mapZoom ?? null,
    bounds: manifest?.bounds ?? null,
    manifestVersion: manifest?.manifestVersion ?? null,
    assetCount: manifest?.assetCount ?? 0,
    status,
    downloadedAt,
    verifiedAt,
    error,
    updatedAt: Date.now(),
  }

  const waypointRecords = waypoints.map((waypoint) => ({
    id: recordId(tourId, waypoint.id),
    tourId,
    stopId: waypoint.id,
    title: waypoint.title ?? geoByStopId[waypoint.id]?.title ?? waypoint.id,
    geo: geoByStopId[waypoint.id] ?? null,
    metadata: serializeWaypointMetadata(waypoint),
  }))

  const transitRecords = legs.map((leg) => {
    const destinationWaypoint = waypoints.find((waypoint) => waypoint.id === leg.toId)
    const narrativeUrl = destinationWaypoint?.transit_narrative_url ?? null

    return {
      id: transitId(tourId, leg.fromId, leg.toId),
      tourId,
      legIndex: leg.index,
      fromId: leg.fromId,
      toId: leg.toId,
      narrativeUrl,
      narrativeCacheKey: narrativeUrl ? canonicalAssetUrl(toAbsoluteAssetUrl(narrativeUrl)) : null,
    }
  })

  const transcriptRecords = waypoints
    .map((waypoint) => {
      const transcript = waypoint.arrival_transcript ?? null
      const headline = waypoint.arrival_headline ?? null
      const subtitle = waypoint.arrival_subtitle ?? null
      if (!transcript && !headline && !subtitle) return null

      return {
        id: recordId(tourId, waypoint.id),
        tourId,
        stopId: waypoint.id,
        arrivalTranscript: transcript,
        arrivalHeadline: headline,
        arrivalSubtitle: subtitle,
      }
    })
    .filter(Boolean)

  const audioAssetRecords = []
  const imageAssetRecords = []

  for (const waypoint of waypoints) {
    for (const field of AUDIO_ASSET_FIELDS) {
      const record = buildAssetReference({
        tourId,
        stopId: waypoint.id,
        field,
        sourceUrl: waypoint[field],
        store: STORES.AUDIO_ASSETS,
      })
      if (record) audioAssetRecords.push(record)
    }

    for (const field of IMAGE_ASSET_FIELDS) {
      const record = buildAssetReference({
        tourId,
        stopId: waypoint.id,
        field,
        sourceUrl: waypoint[field],
        store: STORES.IMAGE_ASSETS,
      })
      if (record) imageAssetRecords.push(record)
    }
  }

  const mediaCueRecords = waypoints
    .map((waypoint) => {
      const cue = {
        id: recordId(tourId, waypoint.id),
        tourId,
        stopId: waypoint.id,
        immersiveOrientationHint: waypoint.immersive_orientation_hint ?? null,
        sliderPosterAtSec: waypoint.slider_poster_at_sec ?? null,
        sliderPosterHoldMs: waypoint.slider_poster_hold_ms ?? null,
        sliderPostAnimationLoopMs: waypoint.slider_post_animation_loop_ms ?? null,
        sliderFreezeAtSec: waypoint.slider_freeze_at_sec ?? null,
        mediaCacheVersion: waypoint.media_cache_version ?? null,
      }

      const hasCueData = Object.entries(cue).some(
        ([key, value]) => !['id', 'tourId', 'stopId'].includes(key) && value != null
      )

      return hasCueData ? cue : null
    })
    .filter(Boolean)

  return {
    tourRecord,
    waypointRecords,
    transitRecords,
    transcriptRecords,
    audioAssetRecords,
    imageAssetRecords,
    mediaCueRecords,
  }
}

export function buildUserProgressRecord(tourId, progress) {
  return {
    tourId,
    targetStopIndex: progress?.targetStopIndex ?? 0,
    transitLegActive: Boolean(progress?.transitLegActive),
    startedAtMs: progress?.startedAtMs ?? null,
    completedAtMs: progress?.completedAtMs ?? null,
    updatedAt: Date.now(),
  }
}

export function buildCompletedWaypointRecords(tourId, arrivedStopIds = [], completedAt = Date.now()) {
  return arrivedStopIds.map((stopId) => ({
    id: recordId(tourId, stopId),
    tourId,
    stopId,
    completedAt,
  }))
}

export function progressFromUserRecord(record, arrivedStopIds = []) {
  if (!record) {
    return {
      targetStopIndex: 0,
      arrivedStopIds: [],
      transitLegActive: false,
    }
  }

  return {
    targetStopIndex: record.targetStopIndex ?? 0,
    arrivedStopIds: [...arrivedStopIds],
    transitLegActive: Boolean(record.transitLegActive),
    startedAtMs: record.startedAtMs ?? null,
    completedAtMs: record.completedAtMs ?? null,
  }
}
