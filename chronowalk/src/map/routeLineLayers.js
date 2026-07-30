import { hex } from '../design/tokens.js'

/** ChronoWalk route orange (Rome terracotta) — never Mapbox default blue. */
export const ROUTE_LINE_COLOR = hex.cityRome
/** Ember gold used for the under-glow bloom. */
export const ROUTE_GLOW_COLOR = hex.ember
/** Hotter core highlight so the path reads lit, not flat. */
export const ROUTE_CORE_COLOR = '#ffc078'

/**
 * Zoom-aware width so the halo stays readable at walking zoom (~15–18).
 * @param {number} width
 */
function zoomWidth(width) {
  return [
    'interpolate',
    ['linear'],
    ['zoom'],
    14,
    width * 0.75,
    16,
    width,
    18,
    width * 1.2,
  ]
}

function casingIdFromGlow(glowLayerId) {
  if (!glowLayerId) return null
  return glowLayerId.endsWith('-glow')
    ? `${glowLayerId.slice(0, -5)}-casing`
    : `${glowLayerId}-casing`
}

/**
 * Stacked glowing route for Mapbox Standard / Standard-Satellite.
 *
 * Three passes (bottom → top):
 * 1. Soft outer bloom (wide + blurred) — the “neon” halo
 * 2. Solid casing (no blur) — keeps the path visible on busy satellite
 * 3. Bright core — solid by default so it doesn’t read as a flat dashed stroke
 *
 * `line-emissive-strength: 1` keeps the path bright under 3D basemap lighting.
 *
 * @see https://docs.mapbox.com/style-spec/reference/layers/#paint-line-line-emissive-strength
 */
export function addGlowingRouteLayers(
  map,
  {
    sourceId,
    glowLayerId,
    casingLayerId = casingIdFromGlow(glowLayerId),
    lineLayerId,
    slot = null,
    glowWidth = 26,
    glowBlur = 3.5,
    glowOpacity = 0.62,
    casingWidth = 11,
    casingOpacity = 0.55,
    lineWidth = 3.75,
    dashed = false,
  } = {},
) {
  if (!map?.addLayer || !sourceId || !glowLayerId || !lineLayerId) return

  const slotProps = slot ? { slot } : {}
  const lineLayout = {
    'line-cap': 'round',
    'line-join': 'round',
  }

  if (!map.getLayer(glowLayerId)) {
    map.addLayer({
      id: glowLayerId,
      type: 'line',
      source: sourceId,
      ...slotProps,
      layout: lineLayout,
      paint: {
        'line-color': ROUTE_GLOW_COLOR,
        'line-width': zoomWidth(glowWidth),
        'line-opacity': glowOpacity,
        'line-blur': glowBlur,
        'line-emissive-strength': 1,
      },
    })
  }

  if (casingLayerId && !map.getLayer(casingLayerId)) {
    map.addLayer({
      id: casingLayerId,
      type: 'line',
      source: sourceId,
      ...slotProps,
      layout: lineLayout,
      paint: {
        'line-color': ROUTE_LINE_COLOR,
        'line-width': zoomWidth(casingWidth),
        'line-opacity': casingOpacity,
        'line-blur': 0.4,
        'line-emissive-strength': 1,
      },
    })
  }

  if (!map.getLayer(lineLayerId)) {
    map.addLayer({
      id: lineLayerId,
      type: 'line',
      source: sourceId,
      ...slotProps,
      layout: lineLayout,
      paint: {
        'line-color': ROUTE_CORE_COLOR,
        'line-width': zoomWidth(lineWidth),
        'line-opacity': 1,
        ...(dashed ? { 'line-dasharray': [1.6, 1.4] } : {}),
        'line-emissive-strength': 1,
      },
    })
  }
}

/** Paint helpers when restyling an existing glowing route after load. */
export function applyWalkingRoutePaint(
  map,
  {
    glowLayerId,
    casingLayerId = casingIdFromGlow(glowLayerId),
    lineLayerId,
    dashed = false,
  } = {},
) {
  if (!map) return

  if (glowLayerId && map.getLayer(glowLayerId)) {
    map.setPaintProperty(glowLayerId, 'line-color', ROUTE_GLOW_COLOR)
    map.setPaintProperty(glowLayerId, 'line-emissive-strength', 1)
    map.setPaintProperty(glowLayerId, 'line-opacity', 0.62)
    map.setPaintProperty(glowLayerId, 'line-blur', 3.5)
  }

  if (casingLayerId && map.getLayer(casingLayerId)) {
    map.setPaintProperty(casingLayerId, 'line-color', ROUTE_LINE_COLOR)
    map.setPaintProperty(casingLayerId, 'line-emissive-strength', 1)
    map.setPaintProperty(casingLayerId, 'line-opacity', 0.55)
  }

  if (lineLayerId && map.getLayer(lineLayerId)) {
    map.setPaintProperty(lineLayerId, 'line-color', ROUTE_CORE_COLOR)
    map.setPaintProperty(lineLayerId, 'line-emissive-strength', 1)
    map.setPaintProperty(lineLayerId, 'line-opacity', 1)
    if (dashed) {
      map.setPaintProperty(lineLayerId, 'line-dasharray', [1.6, 1.4])
    } else {
      // Solid core — clear any leftover dash from older style loads.
      map.setPaintProperty(lineLayerId, 'line-dasharray', null)
    }
  }
}
