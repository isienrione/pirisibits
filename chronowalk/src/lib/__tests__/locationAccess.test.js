import { describe, expect, it, vi, beforeEach } from 'vitest'
import { requestLocationAccess } from '../locationAccess'

vi.mock('../../config/env', () => ({
  isDebugGeo: () => false,
}))

describe('requestLocationAccess', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('resolves granted when geolocation succeeds', async () => {
    navigator.geolocation = {
      getCurrentPosition: (success) => success({ coords: { lat: 41.9, lng: 12.5 } }),
    }

    await expect(requestLocationAccess()).resolves.toBe('granted')
  })

  it('resolves denied when geolocation fails', async () => {
    navigator.geolocation = {
      getCurrentPosition: (_success, error) => error({ code: 1 }),
    }

    await expect(requestLocationAccess()).resolves.toBe('denied')
  })
})
