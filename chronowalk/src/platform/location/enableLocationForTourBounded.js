/**
 * UI-bounded location enablement — defense-in-depth over adapter timeouts.
 * Guarantees busy=false within LOCATION_UI_TIMEOUT_MS even if a native
 * permission Promise misbehaves.
 */

import { enableLocationForTour } from './enableLocationForTour.js'
import { withTimeout } from './locationTimeout.js'
import {
  LOCATION_FIX_STATUS,
  LOCATION_PERMISSION,
  LOCATION_UI_TIMEOUT_MS,
  buildLocationEnableResult,
} from './locationTypes.js'

/**
 * @param {{
 *   uiTimeoutMs?: number,
 *   adapter?: any,
 *   timeoutMs?: number,
 *   waitForFix?: boolean,
 *   skipIfDeniedAlready?: boolean,
 * }} [options]
 * @returns {Promise<import('./locationTypes.js').LocationEnableResult>}
 */
export async function enableLocationForTourBounded(options = {}) {
  const uiTimeoutMs = options.uiTimeoutMs ?? LOCATION_UI_TIMEOUT_MS

  try {
    return await withTimeout(
      enableLocationForTour(options),
      uiTimeoutMs,
      () =>
        Object.assign(new Error('Location permission UI timed out'), {
          code: 'ui_timeout',
          name: 'TimeoutError',
        }),
    )
  } catch (error) {
    if (error?.name === 'TimeoutError' || error?.code === 'ui_timeout') {
      return buildLocationEnableResult({
        permission: LOCATION_PERMISSION.UNAVAILABLE,
        fixStatus: LOCATION_FIX_STATUS.UNAVAILABLE,
        timedOut: true,
      })
    }
    // enableLocationForTour should not throw, but never leave the UI hanging.
    return buildLocationEnableResult({
      permission: LOCATION_PERMISSION.UNAVAILABLE,
      fixStatus: LOCATION_FIX_STATUS.UNAVAILABLE,
      timedOut: true,
    })
  }
}
