import { describe, expect, it, beforeEach, vi } from 'vitest'
import { loadRomeManifest } from '../../content/manifest.js'
import {
  estimateRomeAudioDownload,
  listRomeAudioManifestPaths,
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

  it('estimates download size from file count', () => {
    const estimate = estimateRomeAudioDownload(manifest)
    expect(estimate.fileCount).toBe(listRomeAudioManifestPaths(manifest).length)
    expect(estimate.bytes).toBeGreaterThan(0)
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
})
