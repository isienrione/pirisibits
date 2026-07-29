/**
 * Force-decode landing marketing images so Safari does not wait for
 * inert / opacity-0 carousel layers (or far-down pricing maps) to become active.
 */
export function preloadLandingImages(urls) {
  if (typeof window === 'undefined' || !Array.isArray(urls)) return

  for (const url of urls) {
    if (!url || typeof url !== 'string') continue
    try {
      const img = new Image()
      img.decoding = 'async'
      img.src = url
    } catch {
      // Ignore preload failures; visible <img> tags still request normally.
    }
  }
}

/** One retry when a visible image errors (aborted / flaky mobile network). */
export function retryImageOnError(event) {
  const img = event?.currentTarget
  if (!img || img.dataset.cwRetry === '1') return
  img.dataset.cwRetry = '1'
  const { src } = img
  if (!src) return
  img.removeAttribute('src')
  // Bust any half-cached failure without changing the public URL permanently.
  img.src = src.includes('?') ? `${src}&cw_img=${Date.now()}` : `${src}?cw_img=${Date.now()}`
}
