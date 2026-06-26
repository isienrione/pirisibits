export const EMPTY_STATE_PRESETS = {
  noGps: {
    icon: 'location',
    title: 'Location access is off',
    body: 'ChronoWalk needs your location to detect arrivals and guide you between landmarks. Enable location for this site in your browser settings, then try again.',
    actionLabel: 'Try location again',
  },
  gpsWaiting: {
    icon: 'location',
    title: 'Finding your location',
    body: 'Waiting for a GPS fix. This usually takes a few seconds outdoors.',
    actionLabel: null,
  },
  gpsUnavailable: {
    icon: 'location',
    title: 'GPS signal unavailable',
    body: 'We could not read your position. Move to an open area, check that location services are on, or try again in a moment.',
    actionLabel: 'Retry GPS',
  },
  noInternet: {
    icon: 'offline',
    title: 'You appear to be offline',
    body: 'ChronoWalk needs a connection to load maps, directions, and media. Reconnect to continue your tour.',
    actionLabel: 'Try again',
  },
  noAudio: {
    icon: 'audio',
    title: 'Audio is not ready yet',
    body: 'This landmark story has not been published. You can still explore the map and visual reveals.',
    actionLabel: 'Back to map',
  },
  mediaUnavailable: {
    icon: 'media',
    title: 'Media unavailable',
    body: 'We could not load this view right now. Your audio story and map guidance are still available.',
    actionLabel: 'Try again',
  },
  mediaComingSoon: {
    icon: 'media',
    title: 'View coming soon',
    body: 'The visual reconstruction for this landmark is being prepared. The audio story is ready when you are.',
    actionLabel: null,
  },
  routeUnavailable: {
    icon: 'route',
    title: 'Route unavailable',
    body: 'We could not draw a walking path right now. You can still follow the map or open directions in another app.',
    actionLabel: 'Try again',
  },
  directionsUnavailable: {
    icon: 'route',
    title: 'Walking directions unavailable',
    body: 'We could not build turn-by-turn steps from here. Check your connection or open Google Maps for guidance.',
    actionLabel: 'Try again',
  },
  directionsNeedLocation: {
    icon: 'location',
    title: 'Turn on location for directions',
    body: 'ChronoWalk needs your position to build walking directions from where you are standing.',
    actionLabel: 'Enable location',
  },
  directionsAtDestination: {
    icon: 'journey',
    title: 'You are already here',
    body: 'Head back to the map to explore this landmark and start the audio story.',
    actionLabel: 'Back to map',
  },
  tourCompleted: {
    icon: 'journey',
    title: 'Journey complete',
    body: 'You visited every stop on this route through ancient Rome.',
    actionLabel: 'View summary',
  },
}
