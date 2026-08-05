/**
 * Safe relative path helpers for download manifests and native storage.
 */

const UNSAFE_PATH = /(?:^|[\\/])\.\.(?:[\\/]|$)|^\s*\/|[\0]|^(?:[A-Za-z]:)/

/**
 * True when a relative storage path is safe (no traversal, no absolute roots).
 *
 * @param {string} relativePath
 * @returns {boolean}
 */
export function isSafeRelativePath(relativePath) {
  if (typeof relativePath !== 'string' || relativePath.length === 0) return false
  if (relativePath.includes('\0')) return false
  if (UNSAFE_PATH.test(relativePath)) return false
  if (relativePath.startsWith('/') || relativePath.startsWith('\\')) return false
  const segments = relativePath.split(/[/\\]/).filter(Boolean)
  if (segments.some((s) => s === '..' || s === '.')) return false
  return true
}

/**
 * Normalize a package asset path into a storage-relative path under `files/`.
 *
 * @param {string} assetId
 * @param {string} [sourcePath]
 * @returns {string}
 */
export function toStorageRelativePath(assetId, sourcePath) {
  const cleanId = String(assetId || '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '')
  if (!cleanId) throw new Error('assetId required for storage path')

  if (sourcePath && typeof sourcePath === 'string') {
    const base = sourcePath.split(/[/\\]/).filter(Boolean).pop()
    if (base && !base.includes('..') && !base.includes('\0')) {
      return `files/${cleanId}/${base}`
    }
  }
  return `files/${cleanId}/asset`
}

/**
 * Build native filesystem root for a product version.
 *
 * @param {{ cityId: string, productId: string, locale: string, packageVersion: string }} key
 * @returns {string}
 */
export function productVersionDir(key) {
  const { cityId, productId, locale, packageVersion } = key
  for (const [name, value] of Object.entries({ cityId, productId, locale, packageVersion })) {
    if (!value || typeof value !== 'string' || value.includes('..') || value.includes('/') || value.includes('\\')) {
      throw new Error(`Unsafe download key segment: ${name}`)
    }
  }
  return `chronowalk/downloads/${cityId}/${productId}/${locale}/v${packageVersion}`
}

/**
 * @param {string} cityId
 * @param {string} filename
 * @param {string} [category]
 * @returns {string}
 */
export function defaultAudioPublicPath(cityId, filename, category) {
  const clean = String(filename || '').replace(/^\//, '')
  if (!clean) return ''
  if (category) return `/${cityId}/audio/${category}/${clean}`
  return `/${cityId}/audio/${clean}`
}
