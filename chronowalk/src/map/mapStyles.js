import { hex } from '../design/tokens.js'

/** Mapbox Standard Satellite — Walking-to hero only (heavier imagery tiles). */
export const MAPBOX_STYLE_STANDARD_SATELLITE = 'mapbox://styles/mapbox/standard-satellite'

/** Mapbox Standard vector — full-screen MAP tab (lighter bandwidth). */
export const MAPBOX_STYLE_STANDARD = 'mapbox://styles/mapbox/standard'

/**
 * Basemap config for the Walking companion hero.
 * Dusk light matches ChronoWalk bronze/gold mood over Rome imagery.
 */
export const WALKING_HERO_BASEMAP_CONFIG = Object.freeze({
  lightPreset: 'dusk',
  showPointOfInterestLabels: false,
  showTransitLabels: false,
  showPedestrianRoads: true,
  showRoadsAndTransit: true,
})

/**
 * Basemap config for the full-screen MAP tab.
 * Night Standard + warm road accents — ChronoWalk palette, not Mapbox blue.
 */
export const MAP_TAB_BASEMAP_CONFIG = Object.freeze({
  lightPreset: 'night',
  showPointOfInterestLabels: false,
  showTransitLabels: false,
  showPedestrianRoads: true,
  // Road colors toward bronze / ember / Rome terracotta
  colorMotorways: hex.cityRome,
  colorTrunks: hex.ember,
  colorRoads: hex.bronze,
})

/** True when the style URL is a Mapbox Standard / Standard-Satellite import. */
export function isMapboxStandardStyle(styleUrl) {
  if (!styleUrl || typeof styleUrl !== 'string') return false
  return (
    styleUrl.includes('mapbox://styles/mapbox/standard') ||
    styleUrl.includes('/styles/mapbox/standard')
  )
}

/**
 * Resolve Mapbox style URL + `config.basemap` for a TourMap surface.
 *
 * Performance split: satellite imagery only on the walking hero; the MAP tab
 * stays on Standard vector (night) so the PWA does not pay satellite tile cost
 * on every screen.
 *
 * `VITE_MAPBOX_STYLE_URL` still overrides the MAP-tab style for Studio experiments.
 * The walking hero always prefers Standard Satellite unless an explicit
 * `VITE_MAPBOX_WALKING_STYLE_URL` is set.
 *
 * @param {{ walkingCompanionUI?: boolean }} [options]
 */
export function resolveTourMapStyleOptions({ walkingCompanionUI = false } = {}) {
  if (walkingCompanionUI) {
    const style =
      import.meta.env.VITE_MAPBOX_WALKING_STYLE_URL || MAPBOX_STYLE_STANDARD_SATELLITE
    return {
      style,
      config: {
        basemap: { ...WALKING_HERO_BASEMAP_CONFIG },
      },
      surface: 'walking-hero',
    }
  }

  const style = import.meta.env.VITE_MAPBOX_STYLE_URL || MAPBOX_STYLE_STANDARD
  const usesStandard = isMapboxStandardStyle(style)

  return {
    style,
    config: usesStandard
      ? {
          basemap: { ...MAP_TAB_BASEMAP_CONFIG },
        }
      : undefined,
    surface: 'map-tab',
  }
}
