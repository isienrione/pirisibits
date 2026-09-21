import { describe, expect, it, beforeEach, vi } from 'vitest'

vi.mock('../platform.js', () => ({
  IS_IOS: true,
}))

import {
  disableIosDemoMode,
  enableIosDemoMode,
  isIosDemoMode,
  shouldOfferIosDemoPreview,
  IOS_DEMO_FAR_FROM_ROUTE_M,
} from '../iosDemoMode.js'

describe('iosDemoMode', () => {
  beforeEach(() => {
    disableIosDemoMode()
  })

  it('toggles demo mode in sessionStorage', () => {
    expect(isIosDemoMode()).toBe(false)
    expect(enableIosDemoMode()).toBe(true)
    expect(isIosDemoMode()).toBe(true)
    disableIosDemoMode()
    expect(isIosDemoMode()).toBe(false)
  })

  it('offers preview on iOS always, and when far / denied', () => {
    expect(shouldOfferIosDemoPreview({})).toBe(true)
    expect(
      shouldOfferIosDemoPreview({
        locationDenied: true,
      }),
    ).toBe(true)
    expect(
      shouldOfferIosDemoPreview({
        distanceFromRouteM: IOS_DEMO_FAR_FROM_ROUTE_M + 1,
      }),
    ).toBe(true)
  })
})
