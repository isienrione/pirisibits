/**
 * Account linking helpers for Apple appAccountToken.
 *
 * Do not invent anonymous permanent cross-device account matching.
 * Prefer a stable UUID tied to a signed-in ChronoWalk subject.
 */

/**
 * @typedef {'signed_in' | 'guest' | 'none'} AccountLinkMode
 */

/**
 * @param {{ subjectId?: string | null, isAuthenticated?: boolean }} [context]
 * @returns {{ mode: AccountLinkMode, appAccountToken: string | null, notes: string }}
 */
export function resolveAppAccountTokenPlan(context = {}) {
  const subjectId = context.subjectId ? String(context.subjectId).trim() : ''
  const isAuthenticated = Boolean(context.isAuthenticated)

  if (isAuthenticated && subjectId) {
    return {
      mode: 'signed_in',
      // Callers should persist a UUID v4 mapped to subjectId server-side.
      // We do not hash emails or invent durable guest identities here.
      appAccountToken: null,
      notes:
        'Generate/store a UUID appAccountToken for this subject on the server; pass it into StoreKit purchases.',
    }
  }

  if (subjectId && subjectId !== 'anonymous') {
    return {
      mode: 'signed_in',
      appAccountToken: null,
      notes: 'Subject present — obtain server-issued appAccountToken before purchase.',
    }
  }

  return {
    mode: 'guest',
    appAccountToken: null,
    notes:
      'Guest purchase: StoreKit still records the Apple ID. After account creation, restore + server verify to link. Do not invent anonymous cross-device matching.',
  }
}

/**
 * Documented behaviors (see STOREKIT_AND_APPLE_ENTITLEMENTS.md).
 */
export const ACCOUNT_LINKING_BEHAVIORS = Object.freeze({
  signedInUser:
    'Pass server-issued appAccountToken into the StoreKit purchase; server verification binds txn → subject.',
  guestPurchase:
    'Allow StoreKit purchase without token; keep local candidate. On later signup, restorePurchases + verifyAppleTransaction links ownership.',
  laterAccountCreation:
    'Restore on the new account device; server matches originalTransactionId / JWS to attach entitlement.',
  restoreSecondDevice:
    'restorePurchases() + server verify; never grant from local boolean alone.',
})
