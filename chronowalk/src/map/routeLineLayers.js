import { hex } from '../design/tokens.js'

/** ChronoWalk route orange (Rome terracotta) — never Mapbox default blue. */
export const ROUTE_LINE_COLOR = hex.cityRome
/** Softer ember used for the under-glow bloom. */
export const ROUTE_GLOW_COLOR = hex.ember

/**
 * Stacked glowing route layers for Mapbox Standard / Standard-Satellite.
 * Glow (wide + blurred + low opacity) underneath; crisp dashed line on top.
 * `line-emissive-strength: 1` keeps the path bright under 3D basemap lighting.
 *
 * @see https://docs.mapbox.com/style-spec/reference/layers/#paint-line-line-emissive-strength
 */
export function addGlowingRouteLayers(
  map,
  {
    sourceId,
    glowLayerId,
    lineLayerId,
    slot = null,
    glowWidth = 14,
    glowBlur = 8,
    glowOpacity = 0.32,
    lineWidth = 4,
    dashed = true,
  } = {},
) {
  if (!map?.addLayer || !sourceId || !glowLayerId || !lineLayerId) return

  const slotProps = slot ? { slot } : {}

  if (!map.getLayer(glowLayerId)) {
    map.addLayer({
      id: glowLayerId,
      type: 'line',
      source: sourceId,
      ...slotProps,
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': ROUTE_GLOW_COLOR,
        'line-width': glowWidth,
        'line-opacity': glowOpacity,
        'line-blur': glowBlur,
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
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': ROUTE_LINE_COLOR,
        'line-width': lineWidth,
        'line-opacity': 0.96,
        ...(dashed ? { 'line-dasharray': [1.6, 1.4] } : {}),
        'line-emissive-strength': 1,
      },
    })
  }
}

/** Paint helpers when restyling an existing glowing route after load. */
export function applyWalkingRoutePaint(map, { glowLayerId, lineLayerId } = {}) {
  if (!map) return

  if (glowLayerId && map.getLayer(glowLayerId)) {
    map.setPaintProperty(glowLayerId, 'line-color', ROUTE_GLOW_COLOR)
    map.setPaintProperty(glowLayerId, 'line-emissive-strength', 1)
  }

  if (lineLayerId && map.getLayer(lineLayerId)) {
    map.setPaintProperty(lineLayerId, 'line-color', ROUTE_LINE_COLOR)
    map.setPaintProperty(lineLayerId, 'line-dasharray', [1.6, 1.4])
    map.setPaintProperty(lineLayerId, 'line-emissive-strength', 1)
  }
}
