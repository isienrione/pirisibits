/**
 * Optional native shell bootstrap (status bar + splash).
 * No-ops on web. Safe if Capacitor plugins are unavailable.
 */

import { isNativePlatform } from './platformRuntime.js'

export async function bootstrapNativeShell() {
  if (!isNativePlatform()) return

  if (typeof document !== 'undefined') {
    document.documentElement.classList.add('cw-native-shell')
  }

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    await StatusBar.setStyle({ style: Style.Dark })
  } catch {
    // Plugin may be unavailable in some simulators / web previews.
  }

  try {
    const { SplashScreen } = await import('@capacitor/splash-screen')
    await SplashScreen.hide()
  } catch {
    // Launch storyboard already dismissed, or plugin unavailable.
  }
}
