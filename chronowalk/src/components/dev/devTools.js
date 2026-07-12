export const DEV_SIMULATE_GPS_KEY = 'cw_dev_simulate_gps'
export const DEV_TOOLS_CHANGED = 'cw-dev-tools-changed'

export function readDevSimulateGps() {
  if (typeof window === 'undefined') return false
  return window.sessionStorage.getItem(DEV_SIMULATE_GPS_KEY) === '1'
}

export function setDevSimulateGps(enabled) {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(DEV_SIMULATE_GPS_KEY, enabled ? '1' : '0')
  window.dispatchEvent(new Event(DEV_TOOLS_CHANGED))
}
