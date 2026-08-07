import { registerPlugin } from '@capacitor/core'

/**
 * Capacitor registration for ChronoWalkOfflineMaps.
 * Prefer the app bridge at src/platform/offlineMaps/nativeOfflineMaps.js so the
 * browser bundle never needs this module at runtime.
 */
const ChronoWalkOfflineMaps = registerPlugin('ChronoWalkOfflineMaps', {
  web: () => import('./web.js').then((m) => new m.ChronoWalkOfflineMapsWeb()),
})

export * from './definitions.js'
export { ChronoWalkOfflineMaps }
