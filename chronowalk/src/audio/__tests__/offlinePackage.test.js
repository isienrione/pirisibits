import { describe, expect, it, beforeEach, vi } from 'vitest'
import { loadRomeManifest } from '../../content/manifest.js'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  estimateRomeAudioDownload,
  isCriticalOfflineAudioPath,
  listRomeAudioManifestPaths,
  listRomeMediaManifestPaths,
  readRomeOfflineStatus,
  ROME_OFFLINE_STATUS_KEY,
  writeRomeOfflineStatus,
  OFFLINE_AUDIO_STATUS,
} from '../offlinePackage.js'

describe('offlinePackage', () => {
  const manifest = loadRomeManifest()

  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('lists manifest audio paths', () => {
    const paths = listRomeAudioManifestPaths(manifest)
    expect(paths.length).toBeGreaterThan(60)
    expect(paths[0]).toMatch(/^\/rome\/audio\//)
  })

  it('lists manifest media paths for threshold reconstructions', () => {
    const paths = listRomeMediaManifestPaths(manifest)
    expect(paths).toContain('/waypoints/colosseum/exterior/modern-poster.jpg')
    expect(paths).toContain('/waypoints/colosseum/exterior/ancient-reconstruction.mp4')
    expect(paths).toContain('/waypoints/spanish-steps/modern-poster.jpg')
    expect(paths).toContain('/waypoints/spanish-steps/ancient-reconstruction.mp4')
    // Every shipping reconstruction asset is listed exactly once for offline pack.
    expect(paths.length).toBe(new Set(paths).size)
    expect(paths.length).toBeGreaterThanOrEqual(20)
  })

  it('estimates download size from file count', () => {
    const estimate = estimateRomeAudioDownload(manifest)
    expect(estimate.fileCount).toBe(listRomeAudioManifestPaths(manifest).length)
    expect(estimate.mediaFileCount).toBe(listRomeMediaManifestPaths(manifest).length)
    expect(estimate.bytes).toBeGreaterThan(0)
    expect(estimate.mediaBytes).toBeGreaterThan(0)
    expect(estimate.totalBytes).toBeGreaterThanOrEqual(estimate.bytes + estimate.mediaBytes)
  })

  it('persists offline status in localStorage', () => {
    writeRomeOfflineStatus({
      status: OFFLINE_AUDIO_STATUS.COMPLETE,
      fileCount: 74,
      downloadedAt: 123,
      error: null,
    })

    expect(readRomeOfflineStatus().status).toBe(OFFLINE_AUDIO_STATUS.COMPLETE)
    expect(localStorage.getItem(ROME_OFFLINE_STATUS_KEY)).toBeTruthy()
  })

  it('web offline-ready does not require Cache API map tiles (native TileStore is separate)', () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../offlinePackage.js'),
      'utf8',
    )
    const readyFn = source.slice(source.indexOf('export async function isRomeAudioReadyOffline'))
    expect(readyFn).toContain('isCriticalOfflineAudioPath')
    expect(readyFn).toContain('isNativeIOS')
    expect(readyFn).toContain('isNativePackageMapReady')
    expect(readyFn).not.toContain('isRomeMapReadyOffline')
  })

  it('treats waypoint narration as critical and beds/inserts as optional', () => {
    expect(isCriticalOfflineAudioPath('/rome/audio/narration/w01.mp3')).toBe(true)
    expect(isCriticalOfflineAudioPath('/rome/audio/system/ui_arrival_chime.mp3')).toBe(true)
    expect(isCriticalOfflineAudioPath('/rome/audio/beds/bed_antiquity.mp3')).toBe(false)
    expect(isCriticalOfflineAudioPath('/rome/audio/inserts/ins_fire.mp3')).toBe(false)
    expect(isCriticalOfflineAudioPath('/rome/audio/narration/t02.mp3')).toBe(false)
  })

  it('rejects SPA HTML poison instead of treating it as media', () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../offlinePackage.js'),
      'utf8',
    )
    expect(source).toContain('isHtmlContentType')
    expect(source).toContain('<!doctype html')
    expect(source).toContain('Skipping unavailable optional asset')
  })
})
