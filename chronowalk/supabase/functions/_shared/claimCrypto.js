/**
 * AES-GCM claim secret encrypt/decrypt for fulfillment outbox.
 * Format: base64(iv[12] || ciphertext+tag)
 */

function b64ToBytes(b64) {
  const bin = atob(String(b64))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function bytesToB64(bytes) {
  return btoa(String.fromCharCode(...bytes))
}

export async function importClaimKey(keyB64) {
  const raw = String(keyB64 ?? '').trim()
  if (!raw) return null
  let keyBytes
  try {
    keyBytes = b64ToBytes(raw)
  } catch {
    return null
  }
  if (keyBytes.byteLength !== 32) return null
  return crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt', 'decrypt'])
}

export async function encryptClaimSecret(rawClaim, keyB64) {
  const key = await importClaimKey(keyB64)
  if (!key) return null
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(String(rawClaim)),
  )
  const packed = new Uint8Array(iv.byteLength + cipher.byteLength)
  packed.set(iv, 0)
  packed.set(new Uint8Array(cipher), iv.byteLength)
  return bytesToB64(packed)
}

export async function decryptClaimSecret(encryptedB64, keyB64) {
  const key = await importClaimKey(keyB64)
  if (!key || !encryptedB64) return null
  let packed
  try {
    packed = b64ToBytes(encryptedB64)
  } catch {
    return null
  }
  if (packed.byteLength < 13) return null
  const iv = packed.slice(0, 12)
  const cipher = packed.slice(12)
  try {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher)
    return new TextDecoder().decode(plain)
  } catch {
    return null
  }
}
