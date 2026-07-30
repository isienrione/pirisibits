import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  BOOT_PENDING_KEY,
  CHUNK_RECOVERY_GUARD_KEY,
  SHELL_RESET_AT_KEY,
  SHELL_RESET_KEY,
  SKIP_SW_ONCE_KEY,
  clearBootPending,
  clearChunkRecoveryGuard,
  isStaleChunkError,
  recentlyResetShell,
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
    // Bare network blips must not trigger a hard shell reset mid-download.
    expect(isStaleChunkError(new TypeError('Failed to fetch'))).toBe(false)
  })

  it('defers recovery while offline or mid package download', async () => {
    const { shouldDeferStaleRecovery, recoverStaleClient } = await import('../staleChunkRecovery.js')
    localStorage.setItem(
      'cw_offline_rome_audio_v1',
      JSON.stringify({ status: 'downloading' }),
    )
    expect(shouldDeferStaleRecovery()).toBe(true)
    const result = await recoverStaleClient({ reason: 'test-download' })
    expect(result).toEqual({ recovered: false, reloading: false })
    expect(hardReload).not.toHaveBeenCalled()
  })

  it('defers recovery when an offline package is already complete', async () => {
    const { shouldDeferStaleRecovery, recoverStaleClient } = await import('../staleChunkRecovery.js')
    localStorage.setItem(
      'cw_offline_rome_audio_v1',
      JSON.stringify({ status: 'complete', fileCount: 40 }),
    )
    expect(shouldDeferStaleRecovery()).toBe(true)
    const result = await recoverStaleClient({ reason: 'test-offline-complete' })
    expect(result).toEqual({ recovered: false, reloading: false })
    expect(clearAllCaches).not.toHaveBeenCalled()
    expect(hardReload).not.toHaveBeenCalled()
  })

  it('defers recovery when offline status JSON is corrupt', async () => {
    const { shouldDeferStaleRecovery } = await import('../staleChunkRecovery.js')
    localStorage.setItem('cw_offline_rome_audio_v1', '{not-json')
    expect(shouldDeferStaleRecovery()).toBe(true)
  })

  it('recovers at most once per tab session without clearing credentials', async () => {
    localStorage.setItem('cw_device_credential_v1', 'keep-me')
    localStorage.setItem('cw_access_entitlement_v1', '{"ok":true}')

    const first = await recoverStaleClient()
    expect(first).toEqual({ recovered: true, reloading: true })
    expect(clearAllCaches).toHaveBeenCalledTimes(1)
    expect(unregisterAllServiceWorkers).toHaveBeenCalledTimes(1)
    expect(waitForServiceWorkerControllerGone).toHaveBeenCalled()
    expect(hardReload).toHaveBeenCalledWith({ path: '/rome/reset-shell' })
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
    expect(hardReload).toHaveBeenCalledWith({ path: '/rome/reset-shell' })
    expect(shouldSkipServiceWorkerRegistration()).toBe(true)
  })

  it('after a recent shell reset, skips auto-recover and force goes to landing only', async () => {
    localStorage.setItem(SHELL_RESET_AT_KEY, String(Date.now()))
    expect(recentlyResetShell()).toBe(true)

    const blocked = await recoverStaleClient()
    expect(blocked).toEqual({ recovered: false, reloading: false })
    expect(hardReload).not.toHaveBeenCalled()

    const forced = await recoverStaleClient({ force: true })
    expect(forced).toEqual({ recovered: true, reloading: true })
    expect(hardReload).toHaveBeenCalledWith({ path: '/landing' })
    expect(clearAllCaches).not.toHaveBeenCalled()
  })

  it('clears the guard after a successful boot', () => {
    sessionStorage.setItem(CHUNK_RECOVERY_GUARD_KEY, '1')
    clearChunkRecoveryGuard()
    expect(sessionStorage.getItem(CHUNK_RECOVERY_GUARD_KEY)).toBeNull()
  })

  it('recovers an interrupted boot in the background without blocking mount', async () => {
    sessionStorage.setItem(BOOT_PENDING_KEY, '1')
    expect(recoverInterruptedBoot()).toBe(false)
    expect(sessionStorage.getItem(BOOT_PENDING_KEY)).toBe('1')
    await vi.waitFor(() => {
      expect(hardReload).toHaveBeenCalled()
    })
  })

  it('does not loop interrupted boot during shell-reset cooldown', () => {
    localStorage.setItem(SHELL_RESET_AT_KEY, String(Date.now()))
    sessionStorage.setItem(BOOT_PENDING_KEY, '1')
    expect(recoverInterruptedBoot()).toBe(false)
    expect(sessionStorage.getItem(BOOT_PENDING_KEY)).toBe('1')
    expect(hardReload).not.toHaveBeenCalled()
    clearBootPending()
    expect(sessionStorage.getItem(BOOT_PENDING_KEY)).toBeNull()
  })

  it('marks boot pending on a clean start', () => {
    expect(recoverInterruptedBoot()).toBe(false)
    expect(sessionStorage.getItem(BOOT_PENDING_KEY)).toBe('1')
    clearBootPending()
    expect(sessionStorage.getItem(BOOT_PENDING_KEY)).toBeNull()
  })
})
