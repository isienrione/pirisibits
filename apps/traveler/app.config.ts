export default {
  name: 'ChronoWalk',
  slug: 'chronowalk-traveler',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  scheme: 'chronowalk',
  splash: {
    backgroundColor: '#F7F1E6',
  },
  ios: {
    bundleIdentifier: 'com.chronowalk.traveler',
    supportsTablet: false,
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'ChronoWalk uses your location only while you walk a route, to tell you when you have arrived. It never requests Always access.',
    },
  },
  android: {
    package: 'com.chronowalk.traveler',
    adaptiveIcon: {
      backgroundColor: '#F7F1E6',
      foregroundImage: './assets/icon.png',
    },
    permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
  },
  extra: {
    mapboxToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '',
  },
  plugins: ['expo-font', 'expo-location'],
}
