import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  BOOT_PENDING_KEY,
  CHUNK_RECOVERY_GUARD_KEY,
  SHELL_RESET_KEY,
  SKIP_SW_ONCE_KEY,
  clearBootPending,
  clearChunkRecoveryGuard,
  isStaleChunkError,
  recoverInterruptedBoot,
  recoverStaleClient,
  shouldSkipServiceWorkerRegistration,
} from '../staleChunkRecovery.js'

vi.mock('../pwaCacheUtils.js', () => ({
  clearAllCaches: vi.fn(async () => {}),
  unregisterAllServiceWorkers: vi.fn(async () => {}),
  waitForServiceWorkerControllerGone: vi.fn(async () => true),
  hardReload: vi.fn(),
  showUpdatingOverlay: vi.fn(),
}))

import {
  clearAllCaches,
  hardReload,
  showUpdatingOverlay,
  unregisterAllServiceWorkers,
  waitForServiceWorkerControllerGone,
} from '../pwaCacheUtils.js'

describe('staleChunkRecovery', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
    clearAllCaches.mockClear()
    unregisterAllServiceWorkers.mockClear()
    waitForServiceWorkerControllerGone.mockClear()
    hardReload.mockClear()
    showUpdatingOverlay.mockClear()
  })

  afterEach(() => {
    sessionStorage.clear()
    localStorage.clear()
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
    expect(waitForServiceWorkerControllerGone).toHaveBeenCalled()
    expect(hardReload).toHaveBeenCalledWith({ path: '/reset-shell.html' })
    expect(showUpdatingOverlay).toHaveBeenCalled()
    expect(sessionStorage.getItem(CHUNK_RECOVERY_GUARD_KEY)).toBeTruthy()
    expect(localStorage.getItem(SHELL_RESET_KEY)).toBe('1')
    expect(localStorage.getItem(SKIP_SW_ONCE_KEY)).toBe('1')
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
    expect(hardReload).toHaveBeenCalledWith({ path: '/reset-shell.html' })
    expect(shouldSkipServiceWorkerRegistration()).toBe(true)
  })

  it('clears the guard after a successful boot', () => {
    sessionStorage.setItem(CHUNK_RECOVERY_GUARD_KEY, '1')
    clearChunkRecoveryGuard()
    expect(sessionStorage.getItem(CHUNK_RECOVERY_GUARD_KEY)).toBeNull()
  })

  it('recovers an interrupted boot once', async () => {
    sessionStorage.setItem(BOOT_PENDING_KEY, '1')
    expect(recoverInterruptedBoot()).toBe(true)
    expect(sessionStorage.getItem(BOOT_PENDING_KEY)).toBeNull()
    await vi.waitFor(() => {
      expect(hardReload).toHaveBeenCalled()
    })
  })

  it('marks boot pending on a clean start', () => {
    expect(recoverInterruptedBoot()).toBe(false)
    expect(sessionStorage.getItem(BOOT_PENDING_KEY)).toBe('1')
    clearBootPending()
    expect(sessionStorage.getItem(BOOT_PENDING_KEY)).toBeNull()
  })
})
