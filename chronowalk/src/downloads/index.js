export {
  getDownloadManifest,
  validateDownloadManifest,
  DOWNLOAD_MANIFEST_SCHEMA_VERSION,
} from './downloadManifest.js'

export {
  resolveDownloadProduct,
  listDownloadableProducts,
  downloadRegistryKey,
} from './downloadRegistry.js'

export {
  PRODUCT_DOWNLOAD_STATUSES,
  PRODUCT_DOWNLOAD_TRANSITIONS,
  isProductDownloadStatus,
  canTransitionDownloadStatus,
  createDownloadRecord,
  transitionDownloadRecord,
  downloadRecordHasNoSecrets,
} from './downloadState.js'

export {
  parseChecksum,
  formatSha256Checksum,
  sha256Hex,
  verifyChecksum,
  integrityCapability,
} from './checksum.js'

export { estimateManifestBytes, assessStorageCapacity } from './storageEstimate.js'

export {
  isSafeRelativePath,
  toStorageRelativePath,
  productVersionDir,
} from './paths.js'

export {
  createDownloadService,
  getDownloadService,
  __resetDownloadServiceForTests,
} from './downloadService.js'

export { createWebDownloadAdapter, WEB_DOWNLOAD_CACHE } from './adapters/webDownloadAdapter.js'
export { createNativeDownloadAdapter } from './adapters/nativeDownloadAdapter.js'
export { createMemoryRecordStore, createLocalStorageRecordStore } from './recordStore.js'
