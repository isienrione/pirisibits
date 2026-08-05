/**
 * ChronoWalk generic commerce + entitlements (architecture bridge).
 *
 * Production checkout, webhooks, and access checks are unchanged.
 */

export {
  ENTITLEMENT_SOURCES,
  ENTITLEMENT_STATUSES,
  createEntitlement,
  isEntitlementActive,
  entitlementDedupeKey,
  preferEntitlement,
  dedupeEntitlements,
  hasForbiddenRomeAccessField,
} from './entitlementModel.js'

export {
  LAUNCH_PRODUCT_IDS,
  PRODUCT_NAME_ALIASES,
  getLaunchCatalogFingerprint,
  getLaunchCatalogMetadataKey,
  getLaunchCatalogCurrency,
  listCommerceProducts,
  getCommerceProduct,
  resolveInternalProductId,
  getSkuEntitlementShape,
  getCityIdForProduct,
} from './commerceCatalog.js'

export {
  COMMERCE_PROVIDERS,
  getProviderMapping,
  resolveProductForProvider,
  listEnabledProviderMappings,
  createDisabledAppleMapping,
} from './providerMappings.js'

export {
  normalizePaddlePurchase,
  normalizeLegacyPurchase,
  normalizeAccessTokenGrant,
} from './purchaseAdapter.js'

export {
  getProductsUnlockedByEntitlement,
  normalizeLegacyPurchaseRecord,
  listBundleProductShapes,
  entitlementFromLocalPurchaseId,
  mergeEntitlementLists,
  isKnownCommerceProduct,
} from './legacyPurchaseAdapter.js'

export {
  clearEntitlementStore,
  getEntitlementsForSubject,
  setEntitlementsForSubject,
  grantEntitlement,
  hasEntitlement,
  getEntitledProductIds,
  getUnlockedContentProductIds,
} from './entitlementService.js'
