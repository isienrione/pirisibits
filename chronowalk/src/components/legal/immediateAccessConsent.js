import { t } from '../../i18n/t.js'
import { LOCALES } from '../../i18n/locales.js'

/** Kept for refund-policy / email footnote copy - no longer a checkout checkbox. */
export const IMMEDIATE_ACCESS_CONSENT_LABEL = t('consent.immediate', null, LOCALES.EN)

/** Short post-purchase note for the access email (EU/UK digital content). */
export const ACCESS_EMAIL_WITHDRAWAL_FOOTNOTE = t(
  'consent.withdrawalFootnote',
  null,
  LOCALES.EN,
)

export const TAX_INCLUSIVE_NOTE = t('consent.taxInclusive', null, LOCALES.EN)

export function getImmediateAccessConsentLabel(locale) {
  return t('consent.immediate', null, locale)
}

export function getAccessEmailWithdrawalFootnote(locale) {
  return t('consent.withdrawalFootnote', null, locale)
}

export function getTaxInclusiveNote(locale) {
  return t('consent.taxInclusive', null, locale)
}
