import { DEFAULT_LOCALE, normalizeLocale } from './locales.js'

/** Module-level active locale for non-React callers (audio paths, manifest, copy helpers). */
let activeLocale = DEFAULT_LOCALE

export function getActiveLocale() {
  return activeLocale
}

export function setActiveLocale(locale) {
  activeLocale = normalizeLocale(locale)
  return activeLocale
}
