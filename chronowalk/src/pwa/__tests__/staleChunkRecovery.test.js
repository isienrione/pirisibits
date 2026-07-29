import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CHUNK_RECOVERY_GUARD_KEY,
  clearChunkRecoveryGuard,
  isStaleChunkError,
  recoverStaleClient,
} from '../staleChunkRecovery.js'

vi.mock('../pwaCacheUtils.js', () => ({
  clearAllCaches: vi.fn(async () => {}),
  unregisterAllServiceWorkers: vi.fn(async () => {}),
  hardReload: vi.fn(),
}))

import { clearAllCaches, hardReload, unregisterAllServiceWorkers } from '../pwaCacheUtils.js'

describe('staleChunkRecovery', () => {
  beforeEach(() => {
    sessionStorage.clear()
    clearAllCaches.mockClear()
    unregisterAllServiceWorkers.mockClear()
    hardReload.mockClear()
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  it('detects dynamic import / chunk load failures', () => {
    expect(
      isStaleChunkError(new TypeError('Failed to fetch dynamically imported module')),
    ).toBe(true)
    expect(isStaleChunkError(new TypeError('Load failed'))).toBe(true)
    expect(isStaleChunkError(new SyntaxError("Unexpected token '<'"))).toBe(true)
    expect(isStaleChunkError(new Error('boom'))).toBe(false)
  })

  it('recovers at most once per tab session without clearing credentials', async () => {
    localStorage.setItem('cw_device_credential_v1', 'keep-me')
    localStorage.setItem('cw_access_entitlement_v1', '{"ok":true}')

    const first = await recoverStaleClient()
    expect(first).toEqual({ recovered: true, reloading: true })
    expect(clearAllCaches).toHaveBeenCalledTimes(1)
    expect(unregisterAllServiceWorkers).toHaveBeenCalledTimes(1)
    expect(hardReload).toHaveBeenCalledTimes(1)
    expect(sessionStorage.getItem(CHUNK_RECOVERY_GUARD_KEY)).toBe('1')
    expect(localStorage.getItem('cw_device_credential_v1')).toBe('keep-me')
    expect(localStorage.getItem('cw_access_entitlement_v1')).toBe('{"ok":true}')

    clearAllCaches.mockClear()
    hardReload.mockClear()

    const second = await recoverStaleClient()
    expect(second).toEqual({ recovered: false, reloading: false })
    expect(clearAllCaches).not.toHaveBeenCalled()
    expect(hardReload).not.toHaveBeenCalled()
  })

  it('force recovery bypasses the guard (Try again)', async () => {
    sessionStorage.setItem(CHUNK_RECOVERY_GUARD_KEY, '1')
    await recoverStaleClient({ force: true })
    expect(clearAllCaches).toHaveBeenCalledTimes(1)
    expect(hardReload).toHaveBeenCalledTimes(1)
  })

  it('clears the guard after a successful boot', () => {
    sessionStorage.setItem(CHUNK_RECOVERY_GUARD_KEY, '1')
    clearChunkRecoveryGuard()
    expect(sessionStorage.getItem(CHUNK_RECOVERY_GUARD_KEY)).toBeNull()
  })
})
