import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  closeTransitMap,
  openTransitMap,
  setTransitMapVisible,
  updateTransitMap,
} from '../../platform/offlineMaps/nativeTransitMap.js'
import { resolveActiveMapLeg } from '../../content/mapStops.js'

const FALLBACK_COPY = 'Map unavailable. Continue with step directions.'

function readFrame(el) {
  if (!el || typeof el.getBoundingClientRect !== 'function') return null
  const rect = el.getBoundingClientRect()
  if (rect.width < 2 || rect.height < 2) return null
  return {
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height,
  }
}

/**
 * Native iOS transit map host.
 * Measures its slot and syncs an embedded Mapbox MapView via the offline-maps plugin.
 * Does not initialize Mapbox GL JS.
 */
export default function NativeTransitMapPane({
  manifest = null,
  context = null,
  geo = null,
  directionsGeometry = null,
  directionsModeActive = false,
  cityId = 'rome',
  origin = null,
  destination = null,
  activeStopId = null,
  destinationStopId = null,
}) {
  const hostRef = useRef(null)
  const openedRef = useRef(false)
  const [failed, setFailed] = useState(false)
  const [errorCode, setErrorCode] = useState(null)

  const resolvedDestinationStopId =
    destinationStopId ??
    (manifest && context
      ? resolveActiveMapLeg(
          manifest,
          context.path,
          context.currentSequenceIndex,
          context.promotedOptionalIds,
        ).activeTargetId
      : null)

  const resolvedActiveStopId = activeStopId ?? resolvedDestinationStopId

  const buildParams = useCallback(() => {
    const frame = readFrame(hostRef.current)
    const userPos = geo?.position ?? null
    const dest =
      destination ??
      (userPos && geo?.target
        ? { lat: geo.target.lat, lng: geo.target.lng }
        : null) ??
      null

    // Prefer explicit origin; otherwise use previous-leg endpoint from route start.
    let resolvedOrigin = origin
    if (!resolvedOrigin && directionsGeometry?.coordinates?.length) {
      const first = directionsGeometry.coordinates[0]
      if (Array.isArray(first) && first.length >= 2) {
        resolvedOrigin = { lng: first[0], lat: first[1] }
      }
    }

    return {
      cityId,
      routeGeoJSON: directionsGeometry,
      origin: resolvedOrigin,
      destination: dest,
      currentPosition: userPos,
      activeStopId: resolvedActiveStopId,
      destinationStopId: resolvedDestinationStopId,
      showUserLocation: Boolean(userPos),
      frame,
    }
  }, [
    cityId,
    destination,
    directionsGeometry,
    geo,
    origin,
    resolvedActiveStopId,
    resolvedDestinationStopId,
  ])

  const syncNativeMap = useCallback(async () => {
    const params = buildParams()
    if (!params.frame) return

    try {
      if (!openedRef.current) {
        const result = await openTransitMap(params)
        if (!result?.opened) {
          setFailed(true)
          setErrorCode(result?.errorCode ?? 'download_failed')
          return
        }
        openedRef.current = true
        setFailed(false)
        setErrorCode(null)
        return
      }

      const result = await updateTransitMap(params)
      if (result?.updated === false && result?.errorCode) {
        setFailed(true)
        setErrorCode(result.errorCode)
      } else {
        setFailed(false)
        setErrorCode(null)
      }
    } catch {
      setFailed(true)
      setErrorCode('download_failed')
    }
  }, [buildParams])

  useLayoutEffect(() => {
    let cancelled = false
    const run = () => {
      if (!cancelled) void syncNativeMap()
    }
    run()

    const el = hostRef.current
    let observer = null
    if (typeof ResizeObserver !== 'undefined' && el) {
      observer = new ResizeObserver(() => run())
      observer.observe(el)
    }

    const onScroll = () => run()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)

    return () => {
      cancelled = true
      observer?.disconnect()
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [syncNativeMap])

  useEffect(() => {
    void setTransitMapVisible(true)
    return () => {
      openedRef.current = false
      void setTransitMapVisible(false)
      void closeTransitMap()
    }
  }, [])

  if (failed) {
    return (
      <div
        data-testid="native-transit-map-fallback"
        style={{
          width: '100%',
          height: '100%',
          display: 'grid',
          placeItems: 'center',
          padding: 16,
          textAlign: 'center',
          background: 'var(--obsidian, #0B0B0D)',
          color: 'var(--muted-warm, #D7D0C4)',
          fontSize: 14,
          lineHeight: 1.4,
        }}
      >
        <div>
          <p style={{ margin: 0 }}>{FALLBACK_COPY}</p>
          {errorCode ? (
            <p style={{ margin: '8px 0 0', opacity: 0.65, fontSize: 12 }}>{errorCode}</p>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div
      ref={hostRef}
      data-testid="native-transit-map-host"
      data-native-map="mapbox-maps-ios"
      style={{
        width: '100%',
        height: '100%',
        // Transparent host — native MapView overlays this slot.
        background: 'transparent',
        minHeight: 120,
      }}
    />
  )
}
