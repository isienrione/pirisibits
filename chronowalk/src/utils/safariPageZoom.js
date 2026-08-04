/**
 * Safari iOS still applies native page pinch-zoom on top of CSS `touch-action: none`
 * unless `gesturestart` / `gesturechange` / `gestureend` are cancelled. That leaves
 * `visualViewport.scale > 1` with no reliable programmatic reset — the “stuck zoom”
 * state travelers hit on the landing hero and Then/Now hold.
 */

const SAFARI_GESTURE_EVENTS = ['gesturestart', 'gesturechange', 'gestureend']

function isSafariLike() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  // iOS Safari + iOS Chrome/Firefox (WebKit). Skip desktop Chrome.
  const iOS = /iP(hone|od|ad)/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  return iOS
}

function preventGesture(event) {
  event.preventDefault()
}

/**
 * Block Safari page-zoom gestures on a root (Threshold surface, zoom lightbox, …).
 * @param {EventTarget | null | undefined} root
 * @param {{ blockMultiTouchMove?: boolean }} [options]
 * @returns {() => void} cleanup
 */
export function installSafariPageZoomBlock(root, { blockMultiTouchMove = true } = {}) {
  if (!root || typeof root.addEventListener !== 'function') return () => {}
  if (!isSafariLike()) return () => {}

  for (const type of SAFARI_GESTURE_EVENTS) {
    root.addEventListener(type, preventGesture, { passive: false })
  }

  // Multi-touch move: keep WebKit from starting page zoom. Skip in the
  // transform-based lightbox so pointer pinch/pan still receives moves.
  let onTouchMove = null
  if (blockMultiTouchMove) {
    onTouchMove = (event) => {
      if (event.touches && event.touches.length > 1) {
        event.preventDefault()
      }
    }
    root.addEventListener('touchmove', onTouchMove, { passive: false })
  }

  return () => {
    for (const type of SAFARI_GESTURE_EVENTS) {
      root.removeEventListener(type, preventGesture)
    }
    if (onTouchMove) root.removeEventListener('touchmove', onTouchMove)
  }
}

/**
 * Best-effort reset when Safari left the page zoomed. Not guaranteed; prevention
 * is the real fix. Temporarily clamping maximum-scale can bounce scale back to 1.
 * @returns {boolean} whether a recovery attempt ran
 */
export function attemptSafariZoomRecovery() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false
  if (!isSafariLike()) return false

  const scale = window.visualViewport?.scale ?? 1
  if (!(scale > 1.01)) return false

  const meta = document.querySelector('meta[name="viewport"]')
  if (!meta) return false

  const previous = meta.getAttribute('content') || ''
  // Strip any prior maximum-scale so we can re-apply a temporary clamp.
  const base = previous
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part && !/^maximum-scale=/i.test(part) && !/^user-scalable=/i.test(part))
    .join(', ')

  meta.setAttribute('content', `${base}, maximum-scale=1`)
  // Force layout, then restore the open viewport so accessibility zoom still works later.
  void document.documentElement.offsetHeight
  window.requestAnimationFrame(() => {
    meta.setAttribute('content', previous || base)
  })
  return true
}
