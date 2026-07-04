/** Imperative navigation bridge for non-React modules (e.g. useJourney). */

let navigateFn = null

export function registerAppNavigate(navigate) {
  navigateFn = navigate
}

export function appNavigate(to, options) {
  if (navigateFn) {
    navigateFn(to, options)
    return true
  }

  if (typeof window !== 'undefined') {
    window.location.assign(to)
    return true
  }

  return false
}
