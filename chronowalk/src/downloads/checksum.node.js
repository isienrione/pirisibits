/**
 * Node-only checksum helpers. Not imported by browser / Capacitor runtime.
 */

import { createHash } from 'node:crypto'

/**
 * @param {ArrayBuffer | Uint8Array} data
 * @returns {string} lowercase hex
 */
export function sha256HexNode(data) {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data)
  return createHash('sha256').update(bytes).digest('hex')
}
