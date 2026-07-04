export const ROUTES = {
  home: '/',
  legacy: '/legacy',
  begin: '/begin',
  journey: '/journey',
  walkingDirections: '/journey/directions',
  arrival: '/journey/arrival',
  landmark: '/journey/landmark',
  story: '/journey/story',
  storyChapters: '/journey/story/chapters',
  storyTranscript: '/journey/story/transcript',
  storyReflection: '/journey/story/reflection',
  threshold: '/journey/threshold',
  reconstruction: '/journey/reconstruction',
  overlay: '/journey/overlay',
  continueWalking: '/journey/continue',
  complete: '/complete',
  journeySummary: '/complete/summary',
  journeyTimeline: '/complete/timeline',
  romePassport: '/complete/passport',
  exploreMore: '/complete/explore',
  journeyMemories: '/complete/memories',
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

export function landmarkPath() {
  return ROUTES.landmark
}

export function storyPath() {
  return ROUTES.story
}

export function storyChaptersPath() {
  return ROUTES.storyChapters
}

export function storyTranscriptPath() {
  return ROUTES.storyTranscript
}

export function storyReflectionPath() {
  return ROUTES.storyReflection
}

export function thresholdPath() {
  return ROUTES.threshold
}

export function reconstructionPath() {
  return ROUTES.reconstruction
}

export function overlayPath() {
  return ROUTES.overlay
}

export function continueWalkingPath() {
  return ROUTES.continueWalking
}

export function journeySummaryPath() {
  return ROUTES.journeySummary
}

export function journeyTimelinePath() {
  return ROUTES.journeyTimeline
}

export function romePassportPath() {
  return ROUTES.romePassport
}

export function exploreMorePath() {
  return ROUTES.exploreMore
}

export function journeyMemoriesPath() {
  return ROUTES.journeyMemories
}

export function completePath() {
  return ROUTES.complete
}
