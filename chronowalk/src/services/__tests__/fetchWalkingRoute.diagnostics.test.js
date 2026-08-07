import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fetchWalkingDirections } from '../../services/fetchWalkingRoute.js'

describe('fetchWalkingDirections diagnostics path', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns null with missing token without throwing', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    const result = await fetchWalkingDirections(
      { lat: 41.89, lng: 12.49 },
      { lat: 41.9, lng: 12.48 },
      '',
    )
    expect(result).toBeNull()
    expect(info.mock.calls.some((call) => String(call[0]).includes('[Directions]'))).toBe(
      true,
    )
  })

  it('logs HTTP status on failed Directions responses', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 401,
        async json() {
          return { message: 'Not Authorized - Invalid Token' }
        },
      })),
    )

    const result = await fetchWalkingDirections(
      { lat: 41.89, lng: 12.49 },
      { lat: 41.9, lng: 12.48 },
      'pk.test',
    )
    expect(result).toBeNull()
    const joined = info.mock.calls.map((call) => call.join(' ')).join('\n')
    expect(joined).toMatch(/HTTP status/)
    expect(joined).toMatch(/normalized error code/)
  })
})
