/**
 * Locale-aware legal markdown sources (EN default + ES translations).
 */

import { LOCALES, normalizeLocale } from '../../i18n/locales.js'
import privacyEn from './privacy-policy.md?raw'
import privacyEs from './es/privacy-policy.md?raw'
import refundEn from './refund-policy.md?raw'
import refundEs from './es/refund-policy.md?raw'
import termsEn from './terms-of-service.md?raw'
import termsEs from './es/terms-of-service.md?raw'

const DOCS = Object.freeze({
  privacy: Object.freeze({
    [LOCALES.EN]: privacyEn,
    [LOCALES.ES]: privacyEs,
  }),
  refund: Object.freeze({
    [LOCALES.EN]: refundEn,
    [LOCALES.ES]: refundEs,
  }),
  terms: Object.freeze({
    [LOCALES.EN]: termsEn,
    [LOCALES.ES]: termsEs,
  }),
})

/**
 * @param {'privacy' | 'refund' | 'terms'} docId
 * @param {string} [locale]
 */
export function getLegalDocumentSource(docId, locale = LOCALES.EN) {
  const key = normalizeLocale(locale)
  const byLocale = DOCS[docId]
  if (!byLocale) return ''
  return byLocale[key] ?? byLocale[LOCALES.EN] ?? ''
}
