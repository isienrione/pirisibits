/**
 * Browser-safe location access entry used by begin / permissions UI.
 * Delegates to platform/location — permission ≠ GPS fix.
 */

export {
  requestLocationAccess,
  enableLocationForTour,
  acquirePositionAsync,
  getLocationSession,
  subscribeLocationSession,
  LOCATION_PERMISSION,
  LOCATION_FIX_STATUS,
  INITIAL_FIX_TIMEOUT_MS,
  SIMULATOR_ROME_LOCATION,
  __resetLocationSessionForTests,
  __resetLocationFacadeForTests,
} from '../platform/location/index.js'
