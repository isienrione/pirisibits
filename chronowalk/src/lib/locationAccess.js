import { isDebugGeo } from '../config/env'

export function requestLocationAccess() {
  if (isDebugGeo() || typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.resolve('granted')
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve('granted'),
      () => resolve('denied'),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    )
  })
}
