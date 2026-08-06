/**
 * Resolve which purchase provider the current runtime should use.
 */

import {
  isNativeIOS,
  isNativePlatform,
  isWebPlatform,
  canUseWebCheckout,
  canUseStoreKitPurchase,
} from '../platform/runtime/index.js'

/** @typedef {'paddle' | 'storekit' | 'none'} PurchaseProviderName */

/**
 * @returns {{
 *   provider: PurchaseProviderName,
 *   reason: string,
 *   canUsePaddle: boolean,
 *   canUseStoreKit: boolean,
 * }}
 */
export function resolvePurchaseProvider() {
  if (isWebPlatform() && !isNativePlatform()) {
    return {
      provider: 'paddle',
      reason: 'web_runtime',
      canUsePaddle: canUseWebCheckout(),
      canUseStoreKit: false,
    }
  }

  if (isNativeIOS()) {
    return {
      provider: 'storekit',
      reason: 'native_ios',
      canUsePaddle: false,
      canUseStoreKit: canUseStoreKitPurchase(),
    }
  }

  if (isNativePlatform()) {
    return {
      provider: 'none',
      reason: 'native_unsupported_platform',
      canUsePaddle: false,
      canUseStoreKit: false,
    }
  }

  return {
    provider: 'none',
    reason: 'unknown_platform',
    canUsePaddle: false,
    canUseStoreKit: false,
  }
}

/**
 * Native iOS must never open Paddle checkout.
 *
 * @returns {boolean}
 */
export function canInvokePaddleCheckout() {
  return resolvePurchaseProvider().canUsePaddle === true && isWebPlatform()
}
