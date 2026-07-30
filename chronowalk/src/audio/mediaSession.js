/**
 * Media Session helpers · surface narration in iOS Now Playing / Dynamic Island
 * and lock-screen controls while HTML audio keeps playing in the background.
 */

const ACTIONS = ['play', 'pause', 'seekbackward', 'seekforward', 'previoustrack', 'nexttrack']

export function clearMediaSession() {
  if (typeof navigator === 'undefined' || !navigator.mediaSession) return

  try {
    navigator.mediaSession.metadata = null
    navigator.mediaSession.playbackState = 'none'
  } catch {
    // Some browsers reject clearing metadata.
  }

  for (const action of ACTIONS) {
    try {
      navigator.mediaSession.setActionHandler(action, null)
    } catch {
      // Unsupported action on this platform.
    }
  }
}

export function bindMediaSessionHandlers(handlers = {}) {
  if (typeof navigator === 'undefined' || !navigator.mediaSession?.setActionHandler) {
    return () => {}
  }

  const mapping = [
    ['play', handlers.play],
    ['pause', handlers.pause],
    ['seekbackward', handlers.seekbackward],
    ['seekforward', handlers.seekforward],
    ['previoustrack', handlers.previoustrack],
    ['nexttrack', handlers.nexttrack],
  ]

  for (const [action, handler] of mapping) {
    if (typeof handler !== 'function') continue
    try {
      navigator.mediaSession.setActionHandler(action, handler)
    } catch {
      // Unsupported action on this platform.
    }
  }

  return () => clearMediaSession()
}

export function updateMediaSession({
  title,
  artist = 'ChronoWalk',
  album = 'ChronoWalk',
  playing = false,
  artwork = [],
} = {}) {
  if (typeof navigator === 'undefined' || !navigator.mediaSession) return

  try {
    const Metadata = typeof MediaMetadata !== 'undefined' ? MediaMetadata : null
    if (Metadata) {
      navigator.mediaSession.metadata = new Metadata({
        title: title || 'ChronoWalk',
        artist,
        album,
        artwork,
      })
    }
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'
  } catch {
    // Ignore Media Session failures · playback still works without the panel.
  }
}
