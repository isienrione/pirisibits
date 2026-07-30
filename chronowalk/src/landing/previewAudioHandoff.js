/** Landing → /preview audio session (survives SPA navigation + Strict Mode remounts). */

let sessionAudio = null
let playbackIntent = false

function hideSessionAudio(audio) {
  audio.style.position = 'absolute'
  audio.style.width = '0'
  audio.style.height = '0'
  audio.style.opacity = '0'
  audio.style.pointerEvents = 'none'
}

function sameAudioSrc(currentSrc, nextUrl) {
  if (!currentSrc || !nextUrl) return false
  try {
    const current = new URL(currentSrc, window.location.origin).href
    const next = new URL(nextUrl, window.location.origin).href
    return current === next
  } catch {
    return currentSrc === nextUrl
  }
}

/**
 * Shared preview audio element - not torn down on React effect cleanup.
 * @param {string} url
 * @returns {HTMLAudioElement | null}
 */
export function getPreviewSessionAudio(url) {
  if (!url || typeof Audio === 'undefined') return null

  if (!sessionAudio) {
    sessionAudio = new Audio()
    sessionAudio.preload = 'auto'
  }

  if (!sameAudioSrc(sessionAudio.src, url)) {
    sessionAudio.src = url
  }

  hideSessionAudio(sessionAudio)
  if (!sessionAudio.isConnected) {
    document.body.appendChild(sessionAudio)
  }

  return sessionAudio
}

/**
 * Start preview audio synchronously inside a click handler, then navigate.
 * @param {string} url
 */
export function primePreviewAudioForNavigation(url) {
  const audio = getPreviewSessionAudio(url)
  if (!audio) return

  playbackIntent = true

  const tryPlay = () => {
    const playResult = audio.play()
    if (playResult && typeof playResult.catch === 'function') {
      void playResult.catch(() => {})
    }
  }

  if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
    tryPlay()
  } else {
    audio.addEventListener('canplay', tryPlay, { once: true })
    tryPlay()
  }
}

/** @returns {boolean} Whether preview playback was requested from a user gesture. */
export function consumePreviewPlaybackIntent() {
  const intent = playbackIntent
  playbackIntent = false
  return intent
}

/** Keep playback intent across Strict Mode's mount/unmount/remount cycle. */
export function retainPreviewPlaybackIntent() {
  if (sessionAudio && !sessionAudio.paused) {
    playbackIntent = true
  }
}

/** @returns {HTMLAudioElement | null} */
export function getActivePreviewSessionAudio() {
  return sessionAudio
}

/** @deprecated Use getActivePreviewSessionAudio - kept for existing imports/tests. */
export function consumePreviewAudioHandoff() {
  if (!playbackIntent || !sessionAudio) return null
  playbackIntent = false
  return sessionAudio
}

export function stopPreviewSessionAudio() {
  playbackIntent = false
  if (!sessionAudio) return
  sessionAudio.pause()
  sessionAudio.removeAttribute('src')
  if (sessionAudio.parentNode) {
    sessionAudio.parentNode.removeChild(sessionAudio)
  }
  sessionAudio = null
}

/** @deprecated Use stopPreviewSessionAudio */
export function clearPreviewAudioHandoff() {
  stopPreviewSessionAudio()
}
