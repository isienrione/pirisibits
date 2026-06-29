import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { recoverDynamicImport } from '../lazyWithRecovery'

describe('recoverDynamicImport', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.stubGlobal('location', { reload: vi.fn() })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reloads once when a dynamic import fails with a chunk error', () => {
    const result = recoverDynamicImport(
      new TypeError('Failed to fetch dynamically imported module'),
      'test view'
    )

    expect(result).toEqual({ reloading: true })
    expect(window.location.reload).toHaveBeenCalledTimes(1)
    expect(sessionStorage.getItem('cw-chunk-reload')).toBe('1')
  })

  it('does not reload again if the guard is already set', () => {
    sessionStorage.setItem('cw-chunk-reload', '1')
    const error = new TypeError('Failed to fetch dynamically imported module')

    const result = recoverDynamicImport(error, 'test view')

    expect(result.reloading).toBe(false)
    expect(result.error).toBe(error)
    expect(window.location.reload).not.toHaveBeenCalled()
    expect(sessionStorage.getItem('cw-chunk-reload')).toBeNull()
  })
})
