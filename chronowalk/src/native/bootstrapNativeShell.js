/**
 * One-time native shell setup (Capacitor iOS/Android).
 * No-ops on web so the PWA path stays unchanged.
 */
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'
import { isNativeApp } from '../utils/nativePlatform'

export async function bootstrapNativeShell() {
  if (!isNativeApp()) return

  document.documentElement.classList.add('cw-native-shell')

  try {
    await StatusBar.setStyle({ style: Style.Dark })
  } catch {
    // Plugin may be unavailable in some simulators.
  }

  try {
    await SplashScreen.hide()
  } catch {
    // Launch storyboard already dismissed, or plugin unavailable.
  }
}
