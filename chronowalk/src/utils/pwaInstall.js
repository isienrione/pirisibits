function matchesDisplayMode(query) {
  const matchMedia = typeof window !== 'undefined' ? window.matchMedia : null
  if (typeof matchMedia !== 'function') return false

  try {
    return matchMedia(query).matches
  } catch {
    return false
  }
}

/** True when the app is running as an installed home-screen PWA. */
export function isStandaloneMode() {
  if (typeof window === 'undefined') return false

  return (
    matchesDisplayMode('(display-mode: standalone)') ||
    matchesDisplayMode('(display-mode: fullscreen)') ||
    window.navigator.standalone === true
  )
}

export function isIosDevice() {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

/** Safari on iOS — no beforeinstallprompt; user must use Share → Add to Home Screen. */
export function isIosSafari() {
  if (!isIosDevice()) return false
  const ua = navigator.userAgent
  return /safari/i.test(ua) && !/crios|fxios|edgios|opr\//i.test(ua)
}

export function supportsNativeInstallPrompt() {
  return typeof window !== 'undefined' && 'BeforeInstallPromptEvent' in window
}
