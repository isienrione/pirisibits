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
