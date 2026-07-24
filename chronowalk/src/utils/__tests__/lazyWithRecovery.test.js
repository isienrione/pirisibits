import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { recoverDynamicImport } from '../lazyWithRecovery'

const recoverStaleClient = vi.fn(async () => ({ recovered: true, reloading: true }))

vi.mock('../../pwa/staleChunkRecovery.js', async () => {
  const actual = await vi.importActual('../../pwa/staleChunkRecovery.js')
  return {
    ...actual,
    recoverStaleClient: (...args) => recoverStaleClient(...args),
  }
})

describe('recoverDynamicImport', () => {
  beforeEach(() => {
    sessionStorage.clear()
    recoverStaleClient.mockReset()
    recoverStaleClient.mockImplementation(async () => {
      sessionStorage.setItem('cw-chunk-reload', '1')
      return { recovered: true, reloading: true }
    })
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  it('triggers one stale-client recovery when a dynamic import fails', () => {
    const result = recoverDynamicImport(
      new TypeError('Failed to fetch dynamically imported module'),
      'test view',
    )

    expect(result).toEqual({ reloading: true })
    expect(recoverStaleClient).toHaveBeenCalledTimes(1)
    expect(sessionStorage.getItem('cw-chunk-reload')).toBe('1')
  })

  it('does not recover again if the guard is already set', () => {
    sessionStorage.setItem('cw-chunk-reload', '1')
    const error = new TypeError('Failed to fetch dynamically imported module')

    const result = recoverDynamicImport(error, 'test view')

    expect(result.reloading).toBe(false)
    expect(result.error).toBe(error)
    expect(recoverStaleClient).not.toHaveBeenCalled()
    expect(sessionStorage.getItem('cw-chunk-reload')).toBeNull()
  })
})
