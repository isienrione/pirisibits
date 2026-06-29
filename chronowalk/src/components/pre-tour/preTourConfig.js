/** Pre-tour onboarding / explore screen identifiers. */
export const PRE_TOUR_SCREENS = {
  WELCOME: 'welcome',
  CATALOG: 'catalog',
  TOUR_DETAIL: 'tour-detail',
  FREE_PREVIEW: 'free-preview',
  PWA_INSTALL: 'pwa-install',
  OWNED_HOME: 'owned-home',
  BEGIN_JOURNEY: 'begin-journey',
  PERMISSIONS: 'permissions',
}

export function getInitialPreTourScreen(hasOwnedTours) {
  return hasOwnedTours ? PRE_TOUR_SCREENS.OWNED_HOME : PRE_TOUR_SCREENS.WELCOME
}
