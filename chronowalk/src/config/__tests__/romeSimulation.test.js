import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getDebugGeoPlacement,
  getSimulateLocationParam,
  isDebugGeo,
  isSimulateRome,
  isSimulateRomeTrack,
} from '../env'
import { SIMULATED_ROME_ORIGIN } from '../../dev/romeLocationSimulation.js'
import { offsetDebugPosition } from '../../hooks/useJourneyGeoDebug.js'

const setSearch = (search) => {
  window.history.replaceState({}, '', search || '/')
}

describe('Rome location simulation', () => {
  afterEach(() => {
    setSearch('')
    vi.unstubAllEnvs()
  })

  it('activates via ?simulate=rome in non-production', () => {
    vi.stubEnv('PROD', false)
    setSearch('/journey?simulate=rome')

    expect(getSimulateLocationParam()).toBe('rome')
    expect(isSimulateRome()).toBe(true)
    expect(isSimulateRomeTrack()).toBe(false)
    expect(isDebugGeo()).toBe(true)
    expect(getDebugGeoPlacement()).toBe('rome')
  })

  it('supports rome-track for the short Via dei Fori Imperiali path', () => {
    vi.stubEnv('PROD', false)
    setSearch('/map?simulate=rome-track')

    expect(isSimulateRome()).toBe(true)
    expect(isSimulateRomeTrack()).toBe(true)
    expect(getDebugGeoPlacement()).toBe('rome')
  })

  it('is a no-op in production builds even with the query param', () => {
    vi.stubEnv('PROD', true)
    setSearch('/journey?simulate=rome')

    expect(getSimulateLocationParam()).toBeNull()
    expect(isSimulateRome()).toBe(false)
    expect(getDebugGeoPlacement()).toBeNull()
  })

  it('returns the Colosseum-approach origin for rome placement', () => {
    const position = offsetDebugPosition(
      { lat: 41.9, lng: 12.5 },
      40,
      'rome',
    )

    expect(position).toEqual(SIMULATED_ROME_ORIGIN)
    expect(position.lat).toBeCloseTo(41.891275, 5)
    expect(position.lng).toBeCloseTo(12.491202, 5)
  })
})
