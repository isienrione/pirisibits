/**
 * ChronoWalk multi-city domain layer.
 *
 * Architecture extraction only — production screens do not import this yet.
 * Browser/PWA and future iOS share these contracts; platform differences use adapters.
 */

export {
  CATALOG_SCHEMA_VERSION,
  CITY_PACKAGE_SCHEMA_VERSION,
  CATALOG_ID_FIELDS,
  isCity,
  isTourProduct,
  isRouteStopReference,
  isRoute,
  isStop,
  isStopLocaleContent,
  isAssetReference,
} from './catalog/index.js'

export {
  PURCHASE_ADAPTER_METHODS,
  isEntitlement,
  isPurchaseResult,
  isPurchaseAdapter,
} from './commerce/index.js'

export { isStopProgress, isRouteProgress } from './progress/index.js'

export {
  DOWNLOAD_MANIFEST_SCHEMA_VERSION,
  DOWNLOAD_ADAPTER_METHODS,
  DOWNLOAD_STATUSES,
  isDownloadStatus,
  isDownloadFile,
  isDownloadManifest,
  isDownloadAdapter,
} from './downloads/index.js'

export {
  AUDIO_ADAPTER_METHODS,
  LOCATION_ADAPTER_METHODS,
  STORAGE_ADAPTER_METHODS,
  DEEP_LINK_ADAPTER_METHODS,
  LIFECYCLE_ADAPTER_METHODS,
  PLATFORM_SERVICE_KEYS,
  isAudioAdapter,
  isLocationAdapter,
  isStorageAdapter,
  isDeepLinkAdapter,
  isLifecycleAdapter,
  isPlatformServices,
} from './platform/index.js'
