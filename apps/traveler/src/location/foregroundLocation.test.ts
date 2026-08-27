import { describe, expect, it } from 'vitest'
import { reduceLocationSignal } from './foregroundLocation'

describe('location signal', () => {
  it('covers checking denied awaiting ok weak error planning', () => {
    expect(reduceLocationSignal({ permission: 'checking', fix: null, sim: 'off' }).status).toBe('checking')
    expect(reduceLocationSignal({ permission: 'denied', fix: null, sim: 'off' }).status).toBe('denied')
    expect(
      reduceLocationSignal({ permission: 'granted', fix: null, sim: 'off' }).status,
    ).toBe('granted-awaiting-fix')
    expect(
      reduceLocationSignal({
        permission: 'granted',
        fix: { lat: 41.89, lng: 12.49, accuracyM: 8 },
        sim: 'off',
      }).status,
    ).toBe('ok')
    expect(
      reduceLocationSignal({
        permission: 'granted',
        fix: { lat: 41.89, lng: 12.49, accuracyM: 80 },
        sim: 'off',
      }).status,
    ).toBe('weak')
    expect(
      reduceLocationSignal({ permission: 'granted', fix: null, sim: 'off', errorMessage: 'fail' }).status,
    ).toBe('error')
    expect(reduceLocationSignal({ permission: 'planning', fix: null, sim: 'planning' }).status).toBe(
      'planning',
    )
  })
})
