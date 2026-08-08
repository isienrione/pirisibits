import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  closeTransitMap,
  openTransitMap,
  setTransitMapVisible,
  updateTransitMap,
} from '../../platform/offlineMaps/nativeTransitMap.js'
import {
  nativeMapLog,
  summarizeTransitMapPayload,
} from '../../platform/offlineMaps/nativeMapDiagnostics.js'
import { resolveActiveMapLeg } from '../../content/mapStops.js'

const FALLBACK_COPY =
  'Map unavailable right now — you can still follow step directions or open the stop.'
const MAX_FRAME_WAIT_ATTEMPTS = 24
/** Prefer a real layout size before opening the native overlay (avoids 0×0 / sub-pixel slots). */
const MIN_FRAME_PX = 8

function readFrame(el) {
  if (!el || typeof el.getBoundingClientRect !== 'function') return null
  const rect = el.getBoundingClientRect()
  if (rect.width < MIN_FRAME_PX || rect.height < MIN_FRAME_PX) return null
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
  const frameWaitAttemptsRef = useRef(0)
  const [failed, setFailed] = useState(false)
  const [errorCode, setErrorCode] = useState(null)

  useEffect(() => {
    nativeMapLog('pane mounted')
  }, [])

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
    if (!params.frame) {
      frameWaitAttemptsRef.current += 1
      const host = hostRef.current
      const raw = host?.getBoundingClientRect?.()
      nativeMapLog('measured frame', {
        valid: false,
        attempt: frameWaitAttemptsRef.current,
        raw: raw
          ? {
              x: Math.round(raw.left),
              y: Math.round(raw.top),
              width: Math.round(raw.width),
              height: Math.round(raw.height),
            }
          : null,
      })
      if (frameWaitAttemptsRef.current >= MAX_FRAME_WAIT_ATTEMPTS) {
        nativeMapLog('pane fallback', { errorCode: 'invalid_frame' })
        setFailed(true)
        setErrorCode('invalid_frame')
      }
      return
    }

    frameWaitAttemptsRef.current = 0
    nativeMapLog('measured frame', {
      valid: true,
      x: Math.round(params.frame.x),
      y: Math.round(params.frame.y),
      width: Math.round(params.frame.width),
      height: Math.round(params.frame.height),
    })

    try {
      if (!openedRef.current) {
        nativeMapLog('openTransitMap start', summarizeTransitMapPayload(params))
        const result = await openTransitMap(params)
        nativeMapLog('openTransitMap result', {
          opened: result?.opened ?? false,
          supported: result?.supported ?? false,
          errorCode: result?.errorCode ?? null,
          renderer: result?.renderer ?? null,
        })
        if (!result?.opened) {
          const code = result?.errorCode ?? 'download_failed'
          nativeMapLog('pane fallback', { errorCode: code })
          setFailed(true)
          setErrorCode(code)
          return
        }
        openedRef.current = true
        setFailed(false)
        setErrorCode(null)
        return
      }

      const result = await updateTransitMap(params)
      nativeMapLog('updateTransitMap result', {
        updated: result?.updated ?? false,
        supported: result?.supported ?? false,
        errorCode: result?.errorCode ?? null,
      })
      if (result?.updated === false && result?.errorCode) {
        nativeMapLog('pane fallback', { errorCode: result.errorCode })
        setFailed(true)
        setErrorCode(result.errorCode)
      } else {
        setFailed(false)
        setErrorCode(null)
      }
    } catch (error) {
      nativeMapLog('pane fallback', {
        errorCode: 'download_failed',
        message: typeof error?.message === 'string' ? error.message : 'unknown',
      })
      setFailed(true)
      setErrorCode('download_failed')
    }
  }, [buildParams])

  useLayoutEffect(() => {
    let cancelled = false
    let retryTimer = null

    const run = () => {
      if (!cancelled) void syncNativeMap()
    }
    run()

    // Remeasure until the slot has a real size (flex/clamp layout can be 0 on first paint).
    let attempts = 0
    const scheduleRetry = () => {
      if (cancelled || openedRef.current || failed) return
      if (attempts >= MAX_FRAME_WAIT_ATTEMPTS) return
      attempts += 1
      retryTimer = setTimeout(() => {
        run()
        scheduleRetry()
      }, 50)
    }
    scheduleRetry()

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
      if (retryTimer != null) clearTimeout(retryTimer)
      observer?.disconnect()
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [syncNativeMap, failed])

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
        // Transparent host — native MapView overlays this slot above WKWebView.
        background: 'transparent',
        minHeight: 160,
        minWidth: 1,
        flex: '1 1 auto',
        alignSelf: 'stretch',
      }}
    />
  )
}
