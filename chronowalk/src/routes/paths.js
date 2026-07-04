export const ROUTES = {
  home: '/',
  legacy: '/legacy',
  begin: '/begin',
  journey: '/journey',
  walkingDirections: '/journey/directions',
  arrival: '/journey/arrival',
  complete: '/complete',
}

export function tourDetailPath(destinationId) {
  return `${ROUTES.begin}/${destinationId}`
}

export function purchasePath(destinationId) {
  return `${ROUTES.begin}/${destinationId}/purchase`
}

export function beginJourneyPath(destinationId) {
  return `${ROUTES.begin}/${destinationId}/start`
}

export function chooseExperiencePath(destinationId) {
  return `${ROUTES.begin}/${destinationId}/experience`
}

export function locationPermissionPath(destinationId) {
  return `${ROUTES.begin}/${destinationId}/location`
}

export function offlineDownloadPath(destinationId) {
  return `${ROUTES.begin}/${destinationId}/download`
}

export function walkingDirectionsPath() {
  return ROUTES.walkingDirections
}

export function arrivalPath() {
  return ROUTES.arrival
}
