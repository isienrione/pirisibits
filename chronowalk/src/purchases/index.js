export {
  APPLE_PRODUCT_IDS,
  STOREKIT_PRODUCT_MAPPINGS,
  LOCAL_STOREKIT_SOLO_PRODUCT_IDS,
  getStoreKitMapping,
  getStoreKitMappingByAppleId,
  listApplePurchasableMappings,
  isApplePurchaseDeferred,
  getStoreKitMode,
  isStoreKitLocalMode,
  isStoreKitMappingEnabled,
  resolveInternalProductIdFromApple,
} from './storeKitProductMappings.js'

export {
  normalizeAppleTransaction,
  dedupeAppleEntitlements,
  isServerVerifiedEntitlement,
  isLocalAppleCandidate,
} from './transactionNormalizer.js'

export { processRestoredTransactions } from './restorePurchases.js'

export {
  verifyAppleTransaction,
  APPLE_VERIFICATION_STATUSES,
  APPLE_VERIFICATION_FAILURE_STATES,
} from './serverVerification.js'

export {
  resolveAppAccountTokenPlan,
  ACCOUNT_LINKING_BEHAVIORS,
} from './accountLinking.js'

export { resolvePurchaseProvider, canInvokePaddleCheckout } from './purchaseProvider.js'

export { createWebPurchaseAdapter } from './webPurchaseAdapter.js'
export {
  createStoreKitPurchaseAdapter,
  STOREKIT_PLUGIN_ID,
  STOREKIT_REQUEST_TIMEOUT_MS,
} from './storeKitPurchaseAdapter.js'

export {
  createPurchaseService,
  getPurchaseService,
  __resetPurchaseServiceForTests,
} from './purchaseService.js'
