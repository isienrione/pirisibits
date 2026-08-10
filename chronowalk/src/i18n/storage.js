import { DEFAULT_LOCALE, normalizeLocale } from './locales.js'

export const LOCALE_STORAGE_KEY = 'cw_locale_v1'
export const LOCALE_CHANGED_EVENT = 'chronowalk:locale-changed'

export function readStoredLocale() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    if (!raw) return null
    return normalizeLocale(raw, null)
  } catch {
    return null
  }
}

export function writeStoredLocale(locale) {
  if (typeof window === 'undefined') return
  const next = normalizeLocale(locale)
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next)
    window.dispatchEvent(
      new CustomEvent(LOCALE_CHANGED_EVENT, {
        detail: { locale: next },
      }),
    )
  } catch {
    // ignore quota / privacy errors
  }
}

export function clearStoredLocale() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(LOCALE_STORAGE_KEY)
  } catch {
    // ignore
  }
}

/** Resolve persisted locale or default. Does not invent from navigator (explicit choice). */
export function resolvePersistedLocale(fallback = DEFAULT_LOCALE) {
  return readStoredLocale() ?? fallback
}
