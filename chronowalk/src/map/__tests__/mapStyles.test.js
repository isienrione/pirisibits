import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  isMapboxStandardStyle,
  MAPBOX_STYLE_STANDARD,
  MAPBOX_STYLE_STANDARD_SATELLITE,
  resolveTourMapStyleOptions,
  WALKING_HERO_BASEMAP_CONFIG,
  MAP_TAB_BASEMAP_CONFIG,
} from '../mapStyles.js'

describe('mapStyles', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('uses Standard Satellite with dusk preset for the walking hero', () => {
    const options = resolveTourMapStyleOptions({ walkingCompanionUI: true })

    expect(options.style).toBe(MAPBOX_STYLE_STANDARD_SATELLITE)
    expect(options.surface).toBe('walking-hero')
    expect(options.config.basemap.lightPreset).toBe(WALKING_HERO_BASEMAP_CONFIG.lightPreset)
    expect(options.config.basemap.lightPreset).toBe('dusk')
  })

  it('uses Standard vector for the walking hero when preferOfflineStyle is set', () => {
    const options = resolveTourMapStyleOptions({
      walkingCompanionUI: true,
      preferOfflineStyle: true,
    })

    expect(options.style).toBe(MAPBOX_STYLE_STANDARD)
    expect(options.surface).toBe('walking-hero-offline')
    expect(options.config.basemap.lightPreset).toBe('night')
  })

  it('uses Standard night vector for the MAP tab by default', () => {
    vi.stubEnv('VITE_MAPBOX_STYLE_URL', '')
    const options = resolveTourMapStyleOptions({ walkingCompanionUI: false })

    expect(options.style).toBe(MAPBOX_STYLE_STANDARD)
    expect(options.surface).toBe('map-tab')
    expect(options.config.basemap.lightPreset).toBe('night')
    expect(options.config.basemap.colorMotorways).toBe(MAP_TAB_BASEMAP_CONFIG.colorMotorways)
  })

  it('detects Mapbox Standard style URLs', () => {
    expect(isMapboxStandardStyle(MAPBOX_STYLE_STANDARD)).toBe(true)
    expect(isMapboxStandardStyle(MAPBOX_STYLE_STANDARD_SATELLITE)).toBe(true)
    expect(isMapboxStandardStyle('mapbox://styles/mapbox/light-v11')).toBe(false)
  })
})
