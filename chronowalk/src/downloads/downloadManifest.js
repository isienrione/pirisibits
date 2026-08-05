/**
 * Build and validate versioned download manifests from city packages.
 * Does not hardcode Rome journey logic — only uses package data + catalog helpers.
 */

import { DOWNLOAD_MANIFEST_SCHEMA_VERSION } from '../domain/downloads/schemaVersions.js'
import { isDownloadManifest } from '../domain/downloads/types.js'
import { getPublishedPackage } from '../catalog/cityRegistry.js'
import { findProductById } from '../catalog/productRegistry.js'
import { listRoutesForProduct } from '../catalog/routeRegistry.js'
import { loadCityPackage } from '../content/cityPackage/index.js'
import { resolveDownloadProduct } from './downloadRegistry.js'
import { defaultAudioPublicPath, isSafeRelativePath, toStorageRelativePath } from './paths.js'
import { integrityCapability, parseChecksum } from './checksum.js'
import { estimateManifestBytes } from './storageEstimate.js'

/** @typedef {'audio' | 'image' | 'then_now' | 'transcript' | 'route_metadata' | 'map_package' | 'video' | 'other'} DownloadFileType */

/**
 * @typedef {Object} DownloadManifestFile
 * @property {string} assetId
 * @property {string} id Alias of assetId for callers that prefer `id`.
 * @property {DownloadFileType} type
 * @property {string | null} url Source URL (null when inline/skipped).
 * @property {string} path Relative storage path.
 * @property {number | null} bytes
 * @property {string | null} checksum Never invented — null when unknown.
 * @property {number | null} [duration]
 * @property {boolean} required
 * @property {'verified_capable' | 'unverified' | 'skipped'} integrity
 * @property {boolean} [inline]
 */

/**
 * @typedef {Object} ProductDownloadManifest
 * @property {number} schemaVersion
 * @property {string} cityId
 * @property {string} productId
 * @property {string} locale
 * @property {string} packageVersion
 * @property {number} estimatedBytes
 * @property {DownloadManifestFile[]} files
 * @property {'optional'} checksumPolicy
 */

const DEFAULT_AUDIO_BYTES = 750_000
const DEFAULT_IMAGE_BYTES = 400_000
const DEFAULT_VIDEO_BYTES = 3_000_000
const DEFAULT_OTHER_BYTES = 50_000

/**
 * @param {string} productRef
 * @param {string} [locale]
 * @param {{ package?: import('../content/cityPackage/paths.js').CityPackage | null }} [options]
 * @returns {ProductDownloadManifest}
 */
export function getDownloadManifest(productRef, locale = 'en', options = {}) {
  const resolved = resolveDownloadProduct(productRef)
  if (!resolved) {
    throw createDownloadError('unknown_product', `Unknown download product: ${productRef}`)
  }

  const pkg =
    options.package ??
    getPublishedPackage(resolved.cityId) ??
    tryLoadPackage(resolved.cityId)

  if (!pkg) {
    throw createDownloadError('unknown_city', `No city package for ${resolved.cityId}`)
  }

  const product =
    (pkg.products ?? []).find((p) => p.productId === resolved.productId) ??
    findProductById(resolved.productId)

  if (!product) {
    throw createDownloadError('unknown_product', `Product ${resolved.productId} missing from package`)
  }

  const routeIds = new Set(product.routeIds ?? [])
  const routes = listRoutesForProduct(resolved.productId)
  const stopIds = new Set()
  for (const route of routes) {
    for (const stopId of route.stopIds ?? []) stopIds.add(stopId)
  }
  // When routes come only from the injected package (fixtures), derive stops locally.
  if (stopIds.size === 0) {
    for (const route of pkg.routes ?? []) {
      if (!routeIds.has(route.routeId)) continue
      for (const stopId of route.stopIds ?? []) stopIds.add(stopId)
    }
  }

  /** @type {DownloadManifestFile[]} */
  const files = []
  const seen = new Set()

  for (const asset of pkg.assets ?? []) {
    if (!assetBelongsToProduct(asset, stopIds, routeIds)) continue
    const file = assetToDownloadFile(asset, pkg.cityId, locale)
    if (!file) continue
    if (seen.has(file.assetId)) {
      throw createDownloadError('duplicate_file_id', `Duplicate file id: ${file.assetId}`)
    }
    seen.add(file.assetId)
    files.push(file)
  }

  // Route metadata — generated from package routes for this product (not a remote fetch).
  const routeMetaId = `${resolved.productId}.route_metadata`
  if (!seen.has(routeMetaId)) {
    files.push({
      assetId: routeMetaId,
      id: routeMetaId,
      type: 'route_metadata',
      url: null,
      path: toStorageRelativePath(routeMetaId, 'routes.json'),
      bytes: DEFAULT_OTHER_BYTES,
      checksum: null,
      required: true,
      integrity: 'unverified',
      inline: true,
    })
    seen.add(routeMetaId)
  }

  const packageVersion = String(pkg.metadata?.packageVersion ?? '0.0.0')
  const manifest = {
    schemaVersion: DOWNLOAD_MANIFEST_SCHEMA_VERSION,
    cityId: pkg.cityId,
    productId: resolved.productId,
    locale: locale || pkg.city?.defaultLocale || 'en',
    packageVersion,
    estimatedBytes: 0,
    files,
    checksumPolicy: /** @type {const} */ ('optional'),
  }
  manifest.estimatedBytes = estimateManifestBytes(manifest)

  const validation = validateDownloadManifest(manifest)
  if (!validation.ok) {
    throw createDownloadError(validation.code, validation.message)
  }

  return manifest
}

/**
 * Strict validation beyond the domain shape check.
 *
 * @param {ProductDownloadManifest} manifest
 * @returns {{ ok: true } | { ok: false, code: string, message: string }}
 */
export function validateDownloadManifest(manifest) {
  if (!isDownloadManifest(manifest)) {
    return { ok: false, code: 'invalid_schema', message: 'Manifest failed domain schema check' }
  }
  if (!manifest.cityId || !manifest.productId || !manifest.packageVersion || !manifest.locale) {
    return {
      ok: false,
      code: 'missing_identity',
      message: 'cityId, productId, locale, and packageVersion are required',
    }
  }

  const seen = new Set()
  for (const file of manifest.files) {
    const id = file.assetId || file.id
    if (!id) {
      return { ok: false, code: 'missing_file_id', message: 'File missing id/assetId' }
    }
    if (seen.has(id)) {
      return { ok: false, code: 'duplicate_file_id', message: `Duplicate file id: ${id}` }
    }
    seen.add(id)

    if (!isSafeRelativePath(file.path)) {
      return {
        ok: false,
        code: 'unsafe_path',
        message: `Unsafe relative path for ${id}: ${file.path}`,
      }
    }

    if (file.required !== false && file.integrity !== 'skipped') {
      if (!file.inline && !file.url && file.type !== 'route_metadata') {
        return {
          ok: false,
          code: 'missing_required_source',
          message: `Required file ${id} has no source URL`,
        }
      }
    }

    if (file.checksum != null && !parseChecksum(file.checksum)) {
      return {
        ok: false,
        code: 'invalid_checksum',
        message: `File ${id} has an unparseable checksum (do not invent hashes)`,
      }
    }
  }

  return { ok: true }
}

/**
 * @param {object} asset
 * @param {Set<string>} stopIds
 * @param {Set<string>} routeIds
 */
function assetBelongsToProduct(asset, stopIds, routeIds) {
  if (!asset?.assetId) return false
  // Shared system / beds / inserts / preview always included for the product package.
  if (
    asset.role === 'preview' ||
    asset.category === 'beds' ||
    asset.category === 'system' ||
    asset.category === 'inserts' ||
    asset.zone ||
    asset.insertId ||
    asset.transitId ||
    String(asset.assetId).startsWith('system.') ||
    String(asset.assetId).startsWith('bed.')
  ) {
    return true
  }
  if (asset.stopId) return stopIds.size === 0 || stopIds.has(asset.stopId)
  if (asset.routeId) return routeIds.has(asset.routeId)
  // Unscoped assets (city-wide) are included once.
  return true
}

/**
 * @param {object} asset
 * @param {string} cityId
 * @param {string} locale
 * @returns {DownloadManifestFile | null}
 */
function assetToDownloadFile(asset, cityId, locale) {
  const assetId = asset.assetId
  const type = mapAssetType(asset)
  const required = asset.required !== false && type !== 'video'

  if (asset.inline === true || (type === 'transcript' && !asset.path && !asset.url)) {
    return {
      assetId,
      id: assetId,
      type,
      url: null,
      path: toStorageRelativePath(assetId, 'inline.json'),
      bytes: null,
      checksum: asset.checksum ?? null,
      duration: asset.duration ?? null,
      required: false,
      integrity: 'skipped',
      inline: true,
    }
  }

  const sourcePath = asset.path || null
  const url =
    asset.url ||
    (sourcePath
      ? resolveAssetSourceUrl(cityId, sourcePath, asset.category, type)
      : null)

  if (!url && required) {
    // Skip rather than invent — caller validation may still require coverage.
    return null
  }

  const relative = toStorageRelativePath(assetId, sourcePath || `${assetId}.bin`)
  if (!isSafeRelativePath(relative)) {
    throw createDownloadError('unsafe_path', `Unsafe path derived for ${assetId}`)
  }

  const checksum = asset.checksum ?? null
  if (checksum && !parseChecksum(checksum)) {
    throw createDownloadError(
      'invalid_checksum',
      `Asset ${assetId} declares an invalid checksum; refusing to invent one`,
    )
  }

  return {
    assetId,
    id: assetId,
    type,
    url,
    path: relative,
    bytes: typeof asset.bytes === 'number' ? asset.bytes : defaultBytesForType(type),
    checksum,
    duration: typeof asset.duration === 'number' ? asset.duration : null,
    required,
    integrity: checksum ? integrityCapability({ checksum }) : 'unverified',
    inline: false,
  }
}

/**
 * @param {object} asset
 * @returns {DownloadFileType}
 */
function mapAssetType(asset) {
  const kind = String(asset.kind || 'other')
  if (kind === 'audio') return 'audio'
  if (kind === 'transcript') return 'transcript'
  if (kind === 'video') return 'video'
  if (kind === 'map' || kind === 'map_package') return 'map_package'
  if (kind === 'image') {
    const id = String(asset.assetId || '')
    if (id.includes('.then') || id.includes('.now') || asset.role === 'then' || asset.role === 'now') {
      return 'then_now'
    }
    return 'image'
  }
  return 'other'
}

/**
 * @param {string} cityId
 * @param {string} sourcePath
 * @param {string} [category]
 * @param {DownloadFileType} type
 */
function resolveAssetSourceUrl(cityId, sourcePath, category, type) {
  if (/^https?:\/\//i.test(sourcePath)) return sourcePath
  if (sourcePath.startsWith('/')) return sourcePath
  if (type === 'audio') {
    return defaultAudioPublicPath(cityId, sourcePath, category)
  }
  return `/${cityId}/${sourcePath.replace(/^\//, '')}`
}

/**
 * @param {DownloadFileType} type
 */
function defaultBytesForType(type) {
  if (type === 'audio') return DEFAULT_AUDIO_BYTES
  if (type === 'image' || type === 'then_now') return DEFAULT_IMAGE_BYTES
  if (type === 'video') return DEFAULT_VIDEO_BYTES
  return DEFAULT_OTHER_BYTES
}

/**
 * @param {string} cityId
 */
function tryLoadPackage(cityId) {
  try {
    return loadCityPackage(cityId)
  } catch {
    return null
  }
}

/**
 * @param {string} code
 * @param {string} message
 */
function createDownloadError(code, message) {
  const err = new Error(message)
  err.code = code
  return err
}

export { DOWNLOAD_MANIFEST_SCHEMA_VERSION }
