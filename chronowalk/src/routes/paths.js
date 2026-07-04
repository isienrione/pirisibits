export const ROUTES = {
  home: '/',
  legacy: '/legacy',
  begin: '/begin',
  journey: '/journey',
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
