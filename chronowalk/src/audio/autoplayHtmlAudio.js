/**
 * Start HTMLMediaElement playback with canplay timing and a one-time gesture fallback
 * when the browser blocks autoplay.
 */
export function bindAutoplayHtmlAudio(audio, { onPlaying, onPlayFailed } = {}) {
  if (!audio) return () => {}

  let cancelled = false

  const cleanup = () => {
    cancelled = true
    document.removeEventListener('pointerdown', onGesture, true)
    audio.removeEventListener('canplay', onCanPlay)
  }

  const start = () => {
    if (cancelled) return
    void audio.play().then(() => {
      if (!cancelled) onPlaying?.(true)
    }).catch(() => {
      if (cancelled) return
      onPlayFailed?.()
      document.addEventListener('pointerdown', onGesture, true)
    })
  }

  const onGesture = () => {
    document.removeEventListener('pointerdown', onGesture, true)
    start()
  }

  const onCanPlay = () => start()

  if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
    start()
  } else {
    audio.addEventListener('canplay', onCanPlay, { once: true })
  }

  return cleanup
}
