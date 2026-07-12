import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  BUILD_RELOAD_GUARD_KEY,
  BUILD_STORAGE_KEY,
  ensureFreshBuild,
  ensureFreshBuildAsync,
  parseBuildIdFromSwSource,
} from '../ensureFreshBuild.js'

describe('ensureFreshBuild', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('stores the build id on first visit', () => {
    expect(ensureFreshBuild('build-new')).toBe(false)
    expect(localStorage.getItem(BUILD_STORAGE_KEY)).toBe('build-new')
  })

  it('does nothing when the stored build matches', () => {
    localStorage.setItem(BUILD_STORAGE_KEY, 'build-new')
    expect(ensureFreshBuild('build-new')).toBe(false)
  })

  it('clears caches and reloads when the build changes', async () => {
    localStorage.setItem(BUILD_STORAGE_KEY, 'build-old')

    const cacheDelete = vi.fn().mockResolvedValue(true)
    vi.stubGlobal('caches', {
      keys: vi.fn().mockResolvedValue(['workbox-precache']),
      delete: cacheDelete,
    })

    const unregister = vi.fn().mockResolvedValue(true)
    const getRegistrations = vi.fn().mockResolvedValue([{ unregister }])
    vi.stubGlobal('navigator', {
      serviceWorker: {
        getRegistrations,
      },
    })

    const reload = vi.fn()
    vi.stubGlobal('location', { reload: reload })

    expect(ensureFreshBuild('build-new')).toBe(true)

    await vi.waitFor(() => {
      expect(reload).toHaveBeenCalled()
    })

    expect(cacheDelete).toHaveBeenCalledWith('workbox-precache')
    expect(getRegistrations).toHaveBeenCalled()
    expect(unregister).toHaveBeenCalled()
    expect(localStorage.getItem(BUILD_STORAGE_KEY)).toBe('build-new')
    expect(sessionStorage.getItem(BUILD_RELOAD_GUARD_KEY)).toBe('1')
  })

  it('avoids a second migration reload in the same session', () => {
    sessionStorage.setItem(BUILD_RELOAD_GUARD_KEY, '1')
    localStorage.setItem(BUILD_STORAGE_KEY, 'build-old')

    expect(ensureFreshBuild('build-new')).toBe(false)
    expect(localStorage.getItem(BUILD_STORAGE_KEY)).toBe('build-new')
    expect(sessionStorage.getItem(BUILD_RELOAD_GUARD_KEY)).toBeNull()
  })

  it('parses build id from sw.js source', () => {
    expect(parseBuildIdFromSwSource('prefix: "chronowalk-abc1234"')).toBe('abc1234')
    expect(parseBuildIdFromSwSource('setCacheNameDetails({ prefix: "chronowalk-deadbeef" })')).toBe(
      'deadbeef'
    )
  })

  it('migrates when the network sw.js reports a newer build than the running bundle', async () => {
    localStorage.setItem(BUILD_STORAGE_KEY, 'build-old')

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('prefix: "chronowalk-build-new"'),
    }))

    const cacheDelete = vi.fn().mockResolvedValue(true)
    vi.stubGlobal('caches', {
      keys: vi.fn().mockResolvedValue(['workbox-precache']),
      delete: cacheDelete,
    })

    const unregister = vi.fn().mockResolvedValue(true)
    vi.stubGlobal('navigator', {
      serviceWorker: {
        getRegistrations: vi.fn().mockResolvedValue([{ unregister }]),
      },
    })

    const reload = vi.fn()
    vi.stubGlobal('location', { reload: reload })

    await expect(ensureFreshBuildAsync('build-old')).resolves.toBe(true)

    await vi.waitFor(() => {
      expect(reload).toHaveBeenCalled()
    })

    expect(localStorage.getItem(BUILD_STORAGE_KEY)).toBe('build-new')
  })
})
