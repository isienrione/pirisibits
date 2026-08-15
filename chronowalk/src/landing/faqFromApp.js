export const FAQ_FROM_APP_STORAGE_KEY = 'cw_faq_from_app'

/** Survives hash replaceState that drops `?from=app` on the marketing page. */
export function markFaqOpenedFromApp() {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(FAQ_FROM_APP_STORAGE_KEY, '1')
  } catch {
    // ignore
  }
}

export function clearFaqOpenedFromApp() {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(FAQ_FROM_APP_STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function readFaqFromAppFlag() {
  if (typeof window === 'undefined') return false
  try {
    if (new URLSearchParams(window.location.search).get('from') === 'app') return true
    if (window.sessionStorage.getItem(FAQ_FROM_APP_STORAGE_KEY) === '1') return true
    if (window.location.hash.includes('from=app')) return true
  } catch {
    // ignore
  }
  return false
}
