import { STORES } from './idbSchema'
import { getOfflineStore } from './idbClient'
import {
  buildCompletedWaypointRecords,
  buildUserProgressRecord,
} from './offlineRecords'

const TOUR_SCOPED_STORES = [
  STORES.WAYPOINTS,
  STORES.TRANSITS,
  STORES.TRANSCRIPTS,
  STORES.AUDIO_ASSETS,
  STORES.IMAGE_ASSETS,
  STORES.MEDIA_CUES,
  STORES.COMPLETED_WAYPOINTS,
]

export async function persistOfflineTourRecords(records, packageRecord = null) {
  const store = await getOfflineStore()

  await store.put(STORES.TOURS, records.tourRecord)
  await store.putMany(STORES.WAYPOINTS, records.waypointRecords)
  await store.putMany(STORES.TRANSITS, records.transitRecords)
  await store.putMany(STORES.TRANSCRIPTS, records.transcriptRecords)
  await store.putMany(STORES.AUDIO_ASSETS, records.audioAssetRecords)
  await store.putMany(STORES.IMAGE_ASSETS, records.imageAssetRecords)
  await store.putMany(STORES.MEDIA_CUES, records.mediaCueRecords)

  if (packageRecord) {
    await store.put(STORES.TOUR_PACKAGES, packageRecord)
  }

  return records.tourRecord
}

export async function updateOfflineTourStatus(tourId, patch) {
  const store = await getOfflineStore()
  const existing = await store.get(STORES.TOURS, tourId)
  if (!existing) return null

  const next = {
    ...existing,
    ...patch,
    tourId,
    updatedAt: Date.now(),
  }

  await store.put(STORES.TOURS, next)

  const packageRecord = await store.get(STORES.TOUR_PACKAGES, tourId)
  if (packageRecord) {
    await store.put(STORES.TOUR_PACKAGES, {
      ...packageRecord,
      status: next.status ?? packageRecord.status,
      downloadedAt: next.downloadedAt ?? packageRecord.downloadedAt,
      verifiedAt: next.verifiedAt ?? packageRecord.verifiedAt,
      error: next.error ?? packageRecord.error,
    })
  }

  return next
}

export async function deleteOfflineTourData(tourId) {
  const store = await getOfflineStore()

  await store.delete(STORES.TOURS, tourId)
  await store.delete(STORES.TOUR_PACKAGES, tourId)
  await store.delete(STORES.USER_PROGRESS, tourId)

  for (const storeName of TOUR_SCOPED_STORES) {
    await store.deleteByIndex(storeName, 'tourId', tourId)
  }
}

export async function getOfflineTour(tourId) {
  const store = await getOfflineStore()
  return (await store.get(STORES.TOURS, tourId)) ?? null
}

export async function listOfflineTours() {
  const store = await getOfflineStore()
  return store.getAll(STORES.TOURS)
}

export async function getOfflineWaypoints(tourId) {
  const store = await getOfflineStore()
  return store.getAllByIndex(STORES.WAYPOINTS, 'tourId', tourId)
}

export async function getOfflineWaypointRecord(tourId, stopId) {
  const store = await getOfflineStore()
  return (await store.get(STORES.WAYPOINTS, `${tourId}:${stopId}`)) ?? null
}

export async function getOfflineTransits(tourId) {
  const store = await getOfflineStore()
  return store.getAllByIndex(STORES.TRANSITS, 'tourId', tourId)
}

export async function getOfflineTranscript(tourId, stopId) {
  const store = await getOfflineStore()
  return (await store.get(STORES.TRANSCRIPTS, `${tourId}:${stopId}`)) ?? null
}

export async function getOfflineAudioAssets(tourId) {
  const store = await getOfflineStore()
  return store.getAllByIndex(STORES.AUDIO_ASSETS, 'tourId', tourId)
}

export async function getOfflineImageAssets(tourId) {
  const store = await getOfflineStore()
  return store.getAllByIndex(STORES.IMAGE_ASSETS, 'tourId', tourId)
}

export async function getOfflineMediaCue(tourId, stopId) {
  const store = await getOfflineStore()
  return (await store.get(STORES.MEDIA_CUES, `${tourId}:${stopId}`)) ?? null
}

export async function saveOfflineUserProgress(tourId, progress) {
  const store = await getOfflineStore()
  const record = buildUserProgressRecord(tourId, progress)
  await store.put(STORES.USER_PROGRESS, record)
  await syncOfflineCompletedWaypoints(tourId, progress?.arrivedStopIds ?? [])
  return record
}

export async function loadOfflineUserProgress(tourId) {
  const store = await getOfflineStore()
  const progressRecord = (await store.get(STORES.USER_PROGRESS, tourId)) ?? null
  const completed = await getOfflineCompletedWaypointIds(tourId)

  if (!progressRecord && !completed.length) return null

  return {
    targetStopIndex: progressRecord?.targetStopIndex ?? 0,
    transitLegActive: Boolean(progressRecord?.transitLegActive),
    startedAtMs: progressRecord?.startedAtMs ?? null,
    completedAtMs: progressRecord?.completedAtMs ?? null,
    arrivedStopIds: completed,
    updatedAt: progressRecord?.updatedAt ?? null,
  }
}

export async function syncOfflineCompletedWaypoints(tourId, arrivedStopIds = []) {
  const store = await getOfflineStore()
  await store.deleteByIndex(STORES.COMPLETED_WAYPOINTS, 'tourId', tourId)

  const records = buildCompletedWaypointRecords(tourId, arrivedStopIds)
  if (records.length) {
    await store.putMany(STORES.COMPLETED_WAYPOINTS, records)
  }

  return records
}

export async function getOfflineCompletedWaypointIds(tourId) {
  const store = await getOfflineStore()
  const records = await store.getAllByIndex(STORES.COMPLETED_WAYPOINTS, 'tourId', tourId)
  return records.map((record) => record.stopId)
}

export async function markOfflineWaypointCompleted(tourId, stopId, completedAt = Date.now()) {
  const store = await getOfflineStore()
  await store.put(STORES.COMPLETED_WAYPOINTS, {
    id: `${tourId}:${stopId}`,
    tourId,
    stopId,
    completedAt,
  })
}

export async function readTourPackageRecord(tourId) {
  const store = await getOfflineStore()
  return (await store.get(STORES.TOUR_PACKAGES, tourId)) ?? null
}

export async function writeTourPackageRecord(record) {
  const store = await getOfflineStore()
  await store.put(STORES.TOUR_PACKAGES, record)
  return record
}

export async function deleteTourPackageRecord(tourId) {
  return deleteOfflineTourData(tourId)
}

export async function listTourPackageRecords() {
  const store = await getOfflineStore()
  return store.getAll(STORES.TOUR_PACKAGES)
}
