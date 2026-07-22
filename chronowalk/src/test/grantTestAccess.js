import {
  DEVICE_CREDENTIAL_KEY,
  writeAccessEntitlement,
  writeDeviceCredential,
} from '../lib/accessSession.js'

/** Test-only: seed a valid credential + offline lease. */
export function grantTestAccess({
  credential = 'test-device-credential-000000000000000000000000',
  purchasedProductId = 'rome-complete',
  contentProductId = 'rome-complete',
  seatLimit = 1,
  role = 'solo',
} = {}) {
  writeDeviceCredential(credential)
  writeAccessEntitlement({
    purchasedProductId,
    contentProductId,
    seatLimit,
    role,
    bundleStatus: null,
  })
  try {
    window.localStorage.setItem('cw_purchased_tier_v1', contentProductId || purchasedProductId)
  } catch {
    /* ignore */
  }
  return { credential, key: DEVICE_CREDENTIAL_KEY }
}
