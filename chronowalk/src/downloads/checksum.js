/**
 * Browser / Capacitor-safe checksum helpers (Web Crypto only).
 * Node tooling that cannot use Web Crypto: `./checksum.node.js`.
 */

/**
 * @typedef {'sha256'} ChecksumAlgorithm
 */

/**
 * @param {string | null | undefined} checksum
 * @returns {{ algorithm: ChecksumAlgorithm, hex: string } | null}
 */
export function parseChecksum(checksum) {
  if (!checksum || typeof checksum !== 'string') return null
  const trimmed = checksum.trim()
  if (!trimmed) return null
  const match = /^(sha256):([a-fA-F0-9]{64})$/.exec(trimmed)
  if (!match) return null
  return { algorithm: /** @type {ChecksumAlgorithm} */ (match[1]), hex: match[2].toLowerCase() }
}

/**
 * Format a sha256 hex digest for storage on download files.
 *
 * @param {string} hex
 * @returns {string}
 */
export function formatSha256Checksum(hex) {
  return `sha256:${String(hex).toLowerCase()}`
}

/**
 * @param {ArrayBuffer | Uint8Array} data
 * @returns {Promise<string>} lowercase hex
 */
export async function sha256Hex(data) {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data)
  const subtle = globalThis.crypto?.subtle
  if (!subtle?.digest) {
    throw new Error(
      'Web Crypto SHA-256 is required for checksum verification in this runtime',
    )
  }
  const digest = await subtle.digest('SHA-256', bytes)
  return bufferToHex(new Uint8Array(digest))
}

/**
 * @param {ArrayBuffer | Uint8Array} data
 * @param {string | null | undefined} expectedChecksum
 * @returns {Promise<{ ok: boolean, reason: string, actual: string | null }>}
 */
export async function verifyChecksum(data, expectedChecksum) {
  const parsed = parseChecksum(expectedChecksum)
  if (!parsed) {
    return { ok: false, reason: 'missing_or_unparseable_checksum', actual: null }
  }
  const actual = await sha256Hex(data)
  if (actual !== parsed.hex) {
    return { ok: false, reason: 'checksum_mismatch', actual }
  }
  return { ok: true, reason: 'matched', actual }
}

/**
 * Integrity label for a file entry. Never claim verified without a checksum.
 *
 * @param {{ checksum?: string | null }} file
 * @returns {'verified_capable' | 'unverified'}
 */
export function integrityCapability(file) {
  return parseChecksum(file?.checksum) ? 'verified_capable' : 'unverified'
}

/**
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function bufferToHex(bytes) {
  let out = ''
  for (let i = 0; i < bytes.length; i += 1) {
    out += bytes[i].toString(16).padStart(2, '0')
  }
  return out
}
