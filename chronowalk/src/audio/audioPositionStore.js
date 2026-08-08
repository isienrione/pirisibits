/**
 * Durable narration offset for M1 — persisted with tour progress.
 * Position is in milliseconds; invalid/stale values are clamped on read.
 */

import { loadTourProgress, saveTourProgress } from '../utils/tourProgressStorage.js'

const SAVE_MIN_INTERVAL_MS = 2000

/** @type {Map<string, number>} tourId:stopId -> last save timestamp */
const lastSaveAt = new Map()

/**
 * @param {unknown} value
 * @param {number} [durationMs]
 * @returns {number}
 */
export function clampAudioPositionMs(value, durationMs = 0) {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n) || n < 0) return 0
  if (Number.isFinite(durationMs) && durationMs > 0) {
    // Leave a small epsilon so "completed" is preferred over seeking to the end.
    return Math.min(n, Math.max(0, durationMs - 250))
  }
  return n
}

/**
 * @param {string} tourId
 * @param {string} stopId
 * @returns {{ positionMs: number, itemIndex: number, completed: boolean, updatedAt: string } | null}
 */
export function loadAudioPosition(tourId, stopId) {
  if (!tourId || !stopId) return null
  const progress = loadTourProgress(tourId)
  const entry = progress.audioByStopId?.[stopId]
  if (!entry || typeof entry !== 'object') return null

  const completed = entry.completed === true
  const positionMs = clampAudioPositionMs(entry.positionMs)
  const itemIndex =
    typeof entry.itemIndex === 'number' && Number.isFinite(entry.itemIndex)
      ? Math.max(0, Math.floor(entry.itemIndex))
      : 0

  return {
    positionMs,
    itemIndex,
    completed,
    updatedAt: typeof entry.updatedAt === 'string' ? entry.updatedAt : '',
  }
}

/**
 * @param {string} tourId
 * @param {string} stopId
 * @param {{
 *   positionMs?: number,
 *   itemIndex?: number,
 *   completed?: boolean,
 *   durationMs?: number,
 *   force?: boolean,
 * }} payload
 */
export function saveAudioPosition(tourId, stopId, payload = {}) {
  if (!tourId || !stopId) return null

  const key = `${tourId}:${stopId}`
  const now = Date.now()
  if (!payload.force && !payload.completed) {
    const prev = lastSaveAt.get(key) ?? 0
    if (now - prev < SAVE_MIN_INTERVAL_MS) return loadAudioPosition(tourId, stopId)
  }
  lastSaveAt.set(key, now)

  const progress = loadTourProgress(tourId)
  const audioByStopId = {
    ...(progress.audioByStopId && typeof progress.audioByStopId === 'object'
      ? progress.audioByStopId
      : {}),
  }

  const completed = payload.completed === true
  const positionMs = completed
    ? 0
    : clampAudioPositionMs(payload.positionMs, payload.durationMs)
  const itemIndex =
    typeof payload.itemIndex === 'number' && Number.isFinite(payload.itemIndex)
      ? Math.max(0, Math.floor(payload.itemIndex))
      : 0

  audioByStopId[stopId] = {
    positionMs,
    itemIndex,
    completed,
    updatedAt: new Date().toISOString(),
  }

  saveTourProgress(tourId, {
    ...progress,
    audioByStopId,
  })

  return audioByStopId[stopId]
}

/**
 * @param {string} tourId
 * @param {string} stopId
 */
export function clearAudioPosition(tourId, stopId) {
  if (!tourId || !stopId) return
  const progress = loadTourProgress(tourId)
  if (!progress.audioByStopId?.[stopId]) return
  const audioByStopId = { ...progress.audioByStopId }
  delete audioByStopId[stopId]
  saveTourProgress(tourId, { ...progress, audioByStopId })
  lastSaveAt.delete(`${tourId}:${stopId}`)
}

/** @internal */
export function __resetAudioPositionSaveThrottleForTests() {
  lastSaveAt.clear()
}
