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
  threshold: '/journey/threshold',
  reconstruction: '/journey/reconstruction',
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

export function thresholdPath() {
  return ROUTES.threshold
}

export function reconstructionPath() {
  return ROUTES.reconstruction
}
