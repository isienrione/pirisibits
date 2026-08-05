/**
 * Byte estimates for download manifests.
 */

const FALLBACK_BYTES = 100_000

/**
 * @param {{ files?: Array<{ bytes?: number | null, integrity?: string }> }} manifest
 * @returns {number}
 */
export function estimateManifestBytes(manifest) {
  let total = 0
  for (const file of manifest.files ?? []) {
    if (file.integrity === 'skipped') continue
    if (typeof file.bytes === 'number' && file.bytes >= 0) {
      total += file.bytes
    } else {
      total += FALLBACK_BYTES
    }
  }
  return total
}

/**
 * @param {number} estimatedBytes
 * @param {number | null | undefined} freeBytes
 * @returns {{ ok: boolean, estimatedBytes: number, freeBytes: number | null, code: string | null }}
 */
export function assessStorageCapacity(estimatedBytes, freeBytes) {
  if (freeBytes == null || Number.isNaN(freeBytes)) {
    return {
      ok: true,
      estimatedBytes,
      freeBytes: null,
      code: null,
    }
  }
  if (freeBytes < estimatedBytes) {
    return {
      ok: false,
      estimatedBytes,
      freeBytes,
      code: 'insufficient_space',
    }
  }
  return {
    ok: true,
    estimatedBytes,
    freeBytes,
    code: null,
  }
}
