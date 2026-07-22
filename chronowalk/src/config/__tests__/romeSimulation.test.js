import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getDebugGeoPlacement,
  getSimulateLocationParam,
  isDebugGeo,
  isSimulateRome,
  isSimulateRomeTrack,
} from '../env'
import { SIMULATED_ROME_ORIGIN } from '../../dev/romeLocationSimulation.js'
import { offsetDebugPosition } from '../../hooks/useJourneyGeoDebug.js'

const ORIGINAL_HREF = window.location.href

const setSearch = (search) => {
  window.history.replaceState({}, '', search || '/')
}

/** Neutralize local Vite debug leakage for deterministic defaults. */
function stubNeutralDebugEnv() {
  vi.stubEnv('PROD', false)
  vi.stubEnv('VITE_DEBUG_MAP', '')
  vi.stubEnv('VITE_DEBUG', '')
  vi.stubEnv('VITE_DEBUG_GEO', '')
  vi.stubEnv('VITE_DEBUG_GEO_PLACEMENT', '')
  vi.stubEnv('VITE_SIMULATE_LOCATION', '')
  vi.stubEnv('VITE_SIMULATE_ROME', '')
  vi.stubEnv('VITE_DEV_GEOFENCES', '')
}

describe('Rome location simulation', () => {
  beforeEach(() => {
    stubNeutralDebugEnv()
    setSearch('/')
  })

  afterEach(() => {
    setSearch('/')
    window.history.replaceState({}, '', ORIGINAL_HREF)
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
    expect(isDebugGeo()).toBe(false)
    expect(getDebugGeoPlacement()).toBeNull()
  })

  it('ignores query-based simulation and debug-geo in production', () => {
    vi.stubEnv('PROD', true)
    setSearch('/journey?simulate=rome&debugGeo=walking&geo_debug=approaching')

    expect(getSimulateLocationParam()).toBeNull()
    expect(isSimulateRome()).toBe(false)
    expect(isDebugGeo()).toBe(false)
    expect(getDebugGeoPlacement()).toBeNull()
  })

  it('ignores environment-based simulation and debug placement in production', () => {
    vi.stubEnv('PROD', true)
    vi.stubEnv('VITE_SIMULATE_LOCATION', 'rome')
    vi.stubEnv('VITE_SIMULATE_ROME', 'rome-track')
    vi.stubEnv('VITE_DEBUG_GEO', 'true')
    vi.stubEnv('VITE_DEBUG_GEO_PLACEMENT', 'arrived')
    setSearch('/')

    expect(getSimulateLocationParam()).toBeNull()
    expect(isSimulateRome()).toBe(false)
    expect(isDebugGeo()).toBe(false)
    expect(getDebugGeoPlacement()).toBeNull()
  })

  it('does not let local Vite debug env contaminate default expectations', () => {
    vi.stubEnv('PROD', false)
    vi.stubEnv('VITE_DEBUG_GEO', 'true')
    vi.stubEnv('VITE_DEBUG_GEO_PLACEMENT', 'arrived')
    vi.stubEnv('VITE_SIMULATE_LOCATION', 'rome')
    setSearch('/')
    expect(isSimulateRome()).toBe(true)
    expect(getDebugGeoPlacement()).toBe('rome')

    stubNeutralDebugEnv()
    setSearch('/')
    expect(isSimulateRome()).toBe(false)
    expect(isDebugGeo()).toBe(false)
    expect(getDebugGeoPlacement()).toBeNull()
  })

  it('permits explicit debug geo and placement in development', () => {
    vi.stubEnv('PROD', false)
    vi.stubEnv('VITE_DEBUG_GEO', 'true')
    vi.stubEnv('VITE_DEBUG_GEO_PLACEMENT', 'walking')
    setSearch('/')

    expect(isDebugGeo()).toBe(true)
    expect(getDebugGeoPlacement()).toBe('walking')

    setSearch('/?debugGeo=approaching')
    expect(getDebugGeoPlacement()).toBe('approaching')
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
