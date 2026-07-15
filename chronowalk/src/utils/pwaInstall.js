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

/** Chrome / Edge / Firefox / Opera on iOS — cannot Add to Home Screen; must open Safari. */
export function isIosNonSafari() {
  if (!isIosDevice()) return false
  return /crios|fxios|edgios|opr\//i.test(navigator.userAgent)
}

/** Safari on iOS — no beforeinstallprompt; user must use Share → Add to Home Screen. */
export function isIosSafari() {
  if (!isIosDevice()) return false
  return !isIosNonSafari()
}

export function supportsNativeInstallPrompt() {
  return typeof window !== 'undefined' && 'BeforeInstallPromptEvent' in window
}
