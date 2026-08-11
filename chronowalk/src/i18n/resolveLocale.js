import { DEFAULT_LOCALE, normalizeLocale } from './locales.js'
import { readStoredLocale } from './storage.js'

/**
 * Resolve locale for boot / deep links.
 * Priority: explicit `?lang=` → stored preference → fallback (default en).
 *
 * Navigator language is never used for the product default: ChronoWalk boots
 * in English unless the traveler has chosen Spanish (or arrives with ?lang=).
 * `preferNavigator` remains available for tests / tooling only.
 */
export function resolveLocale({
  search = typeof window !== 'undefined' ? window.location.search : '',
  stored = readStoredLocale(),
  preferNavigator = false,
  fallback = DEFAULT_LOCALE,
} = {}) {
  try {
    const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`)
    const fromQuery = params.get('lang')
    if (fromQuery) return normalizeLocale(fromQuery, fallback)
  } catch {
    // ignore malformed search
  }

  if (stored) return normalizeLocale(stored, fallback)

  if (preferNavigator && typeof navigator !== 'undefined') {
    const nav = navigator.languages?.[0] || navigator.language
    if (nav) {
      const normalized = normalizeLocale(nav, null)
      if (normalized) return normalized
    }
  }

  return fallback
}

export function consumeLangQueryParam() {
  if (typeof window === 'undefined') return null
  try {
    const url = new URL(window.location.href)
    const lang = url.searchParams.get('lang')
    if (!lang) return null
    url.searchParams.delete('lang')
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
    return normalizeLocale(lang, null)
  } catch {
    return null
  }
}
