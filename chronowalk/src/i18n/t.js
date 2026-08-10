import { DEFAULT_LOCALE, normalizeLocale } from './locales.js'
import { getActiveLocale } from './activeLocale.js'
import { enMessages } from './messages/en.js'
import { esMessages } from './messages/es.js'

const CATALOGS = Object.freeze({
  en: enMessages,
  es: esMessages,
})

export function getMessageCatalog(locale = getActiveLocale()) {
  const key = normalizeLocale(locale)
  return CATALOGS[key] ?? CATALOGS[DEFAULT_LOCALE]
}

/**
 * Look up a message key. Missing keys fall back to English, then the key itself.
 * Interpolation: `t('hello', { name: 'Ada' })` replaces `{name}` in the string.
 */
export function t(key, vars = {}, locale = getActiveLocale()) {
  if (!key) return ''
  const primary = getMessageCatalog(locale)
  const fallback = getMessageCatalog(DEFAULT_LOCALE)
  let template = primary[key] ?? fallback[key] ?? key

  if (vars && typeof template === 'string') {
    for (const [name, value] of Object.entries(vars)) {
      template = template.replaceAll(`{${name}}`, String(value ?? ''))
    }
  }

  return template
}

export function listMessageKeys(locale = DEFAULT_LOCALE) {
  return Object.keys(getMessageCatalog(locale)).sort()
}

export function missingMessageKeys(locale) {
  const baseKeys = listMessageKeys(DEFAULT_LOCALE)
  const target = getMessageCatalog(locale)
  return baseKeys.filter((key) => typeof target[key] !== 'string' || target[key].length === 0)
}
