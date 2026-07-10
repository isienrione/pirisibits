/**
 * Network helper for boot-time PWA migrations. Avoids blocking app render when
 * /sw.js or revision checks hang on slow mobile networks.
 */
export async function fetchWithTimeout(url, options = {}, timeoutMs = 4000) {
  if (typeof fetch === 'undefined') return null

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    })
  } catch {
    return null
  } finally {
    window.clearTimeout(timer)
  }
}
