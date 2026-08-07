/**
 * Dev/local native-map diagnostics. No tokens or coordinates.
 * Safe to call from production Capacitor builds during diagnosis.
 */

export function nativeMapLog(message, detail) {
  if (typeof console === 'undefined' || typeof console.info !== 'function') return
  if (detail === undefined) {
    console.info(`[NativeMap] ${message}`)
    return
  }
  console.info(`[NativeMap] ${message}`, detail)
}

export function directionsLog(message, detail) {
  if (typeof console === 'undefined' || typeof console.info !== 'function') return
  if (detail === undefined) {
    console.info(`[Directions] ${message}`)
    return
  }
  console.info(`[Directions] ${message}`, detail)
}

/**
 * Summarize a transit map payload without logging coordinates.
 * @param {object} payload
 */
export function summarizeTransitMapPayload(payload = {}) {
  return {
    cityId: payload.cityId ?? null,
    hasFrame: Boolean(payload.frame),
    frame:
      payload.frame && typeof payload.frame === 'object'
        ? {
            x: round(payload.frame.x),
            y: round(payload.frame.y),
            width: round(payload.frame.width),
            height: round(payload.frame.height),
          }
        : null,
    hasRoute: Boolean(
      payload.routeGeoJSON?.coordinates?.length ||
        payload.routeGeoJSON?.geometry?.coordinates?.length,
    ),
    hasOrigin: Boolean(payload.origin),
    hasDestination: Boolean(payload.destination),
    hasCurrentPosition: Boolean(payload.currentPosition),
  }
}

function round(value) {
  const n = Number(value)
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : null
}

/**
 * Documented CSS→host overlay math (UIKit points == CSS px; do NOT use devicePixelRatio).
 * Mirrors ChronoWalkTransitMapPresenter.convertFrame additive path.
 *
 * @param {{ x: number, y: number, width: number, height: number }} cssFrame
 * @param {{ x: number, y: number }} webOriginInHost
 */
export function computeOverlayFramePoints(cssFrame, webOriginInHost = { x: 0, y: 0 }) {
  if (!cssFrame) return null
  const width = Number(cssFrame.width)
  const height = Number(cssFrame.height)
  if (!(width > 0) || !(height > 0)) return null
  return {
    x: Number(webOriginInHost.x || 0) + Number(cssFrame.x || 0),
    y: Number(webOriginInHost.y || 0) + Number(cssFrame.y || 0),
    width,
    height,
  }
}
