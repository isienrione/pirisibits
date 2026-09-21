import { isDebugGeo } from '../config/env'
import { getCurrentPosition } from './nativeGeolocation.js'
import { IS_IOS } from './platform.js'

export async function requestLocationAccess() {
  if (isDebugGeo()) {
    return 'granted'
  }

  if (!IS_IOS && (typeof navigator === 'undefined' || !navigator.geolocation)) {
    return 'denied'
  }

  const pos = await getCurrentPosition({
    enableHighAccuracy: true,
    timeout: 12000,
    maximumAge: 0,
  })
  return pos ? 'granted' : 'denied'
}
