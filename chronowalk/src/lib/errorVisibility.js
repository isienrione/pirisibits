/**
 * Client error / performance visibility helpers.
 * Global handlers + LCP watcher; event payloads go through analytics.track.
 */
import {
  trackAssetLoadFailed,
  trackJsError,
  trackMapboxInitFailed,
  trackSlowPage,
} from './analytics.ts'

const LCP_SLOW_MS = 2500
const STACK_HEAD_LINES = 6

let globalsInstalled = false
let lcpInstalled = false

export function stackHead(stack, lines = STACK_HEAD_LINES) {
  if (!stack) return null
  return String(stack)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, lines)
    .join('\n')
}

function reportJsError({ message, source, lineno, stack }) {
  trackJsError({
    message: message ? String(message).slice(0, 500) : 'unknown',
    source: source ? String(source).slice(0, 500) : null,
    lineno: Number.isFinite(Number(lineno)) ? Number(lineno) : null,
    stackHead: stackHead(stack),
  })
}

/**
 * window.onerror + onunhandledrejection → track('js_error', …).
 * Safe to call multiple times.
 */
export function installGlobalErrorHandlers() {
  if (typeof window === 'undefined' || globalsInstalled) return () => {}
  globalsInstalled = true

  const previousOnError = window.onerror
  const previousOnRejection = window.onunhandledrejection

  window.onerror = function onChronoWalkError(message, source, lineno, _colno, error) {
    try {
      reportJsError({
        message,
        source,
        lineno,
        stack: error?.stack,
      })
    } catch {
      /* never throw from the error handler */
    }
    if (typeof previousOnError === 'function') {
      return previousOnError.apply(this, arguments)
    }
    return false
  }

  window.onunhandledrejection = function onChronoWalkUnhandledRejection(event) {
    try {
      const reason = event?.reason
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === 'string'
            ? reason
            : 'unhandledrejection'
      reportJsError({
        message,
        source: 'unhandledrejection',
        lineno: null,
        stack: reason instanceof Error ? reason.stack : null,
      })
    } catch {
      /* ignore */
    }
    if (typeof previousOnRejection === 'function') {
      return previousOnRejection.call(this, event)
    }
  }

  return () => {
    window.onerror = previousOnError ?? null
    window.onunhandledrejection = previousOnRejection ?? null
    globalsInstalled = false
  }
}

/**
 * Observe Largest Contentful Paint; fire track('slow_page') when LCP > 2500ms.
 */
export function installLcpSlowPageWatcher() {
  if (typeof window === 'undefined' || lcpInstalled) return () => {}
  if (typeof PerformanceObserver === 'undefined') return () => {}

  lcpInstalled = true
  let fired = false

  let observer
  try {
    observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const last = entries[entries.length - 1]
      if (!last || fired) return
      const lcpMs = Math.round(last.startTime)
      if (lcpMs > LCP_SLOW_MS) {
        fired = true
        trackSlowPage({ lcpMs })
      }
    })
    observer.observe({ type: 'largest-contentful-paint', buffered: true })
  } catch {
    lcpInstalled = false
    return () => {}
  }

  return () => {
    try {
      observer?.disconnect()
    } catch {
      /* ignore */
    }
    lcpInstalled = false
  }
}

/** Mapbox GL failed to load or construct — once per reason key. */
export function reportMapboxInitFailure(reason, detail) {
  trackMapboxInitFailed({
    reason: reason ? String(reason).slice(0, 200) : 'unknown',
    detail: detail ? String(detail).slice(0, 400) : null,
  })
}

/** Preview / media audio element failed. */
export function reportAudioLoadFailure(assetUrl) {
  trackAssetLoadFailed({
    assetUrl: assetUrl ? String(assetUrl).slice(0, 500) : null,
    assetType: 'audio',
  })
}

/** Image onError — once per URL per page lifetime. */
const failedImageUrls = new Set()

export function reportImageLoadFailure(assetUrl) {
  const url = assetUrl ? String(assetUrl).slice(0, 500) : ''
  if (!url || failedImageUrls.has(url)) return false
  failedImageUrls.add(url)
  return trackAssetLoadFailed({ assetUrl: url, assetType: 'image' })
}

/** @internal */
export function __resetErrorVisibilityForTests() {
  globalsInstalled = false
  lcpInstalled = false
  failedImageUrls.clear()
}

export { LCP_SLOW_MS }
