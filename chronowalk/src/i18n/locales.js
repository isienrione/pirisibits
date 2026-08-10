/** Supported product locales. English is the default; Spanish is the second ship locale. */

export const LOCALES = Object.freeze({
  EN: 'en',
  ES: 'es',
})

export const DEFAULT_LOCALE = LOCALES.EN

export const SUPPORTED_LOCALES = Object.freeze([LOCALES.EN, LOCALES.ES])

export const LOCALE_LABELS = Object.freeze({
  [LOCALES.EN]: 'English',
  [LOCALES.ES]: 'Español',
})

export function isSupportedLocale(value) {
  return SUPPORTED_LOCALES.includes(value)
}

export function normalizeLocale(value, fallback = DEFAULT_LOCALE) {
  if (typeof value !== 'string') return fallback
  const base = value.trim().toLowerCase().split(/[-_]/)[0]
  return isSupportedLocale(base) ? base : fallback
}
