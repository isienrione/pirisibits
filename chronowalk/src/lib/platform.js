import { Capacitor } from '@capacitor/core'

/**
 * True for the Capacitor iOS build flavor and when running inside a native shell.
 * Web builds leave VITE_PLATFORM unset and Capacitor.isNativePlatform() false,
 * so all IS_IOS gates stay inert on the live PWA.
 */
export const IS_IOS =
  import.meta.env.VITE_PLATFORM === 'ios' || Capacitor.isNativePlatform()
