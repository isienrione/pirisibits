/**
 * Capacitor shell bootstrap — status bar + splash (IS_IOS only).
 */
import { IS_IOS } from '../lib/platform.js'

let splashHidden = false

function lockIosViewport() {
  if (typeof document === 'undefined') return
  const meta = document.querySelector('meta[name="viewport"]')
  if (!meta) return
  meta.setAttribute(
    'content',
    'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content',
  )
}

export async function bootstrapNativeShell() {
  if (!IS_IOS) return

  lockIosViewport()

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    await StatusBar.setStyle({ style: Style.Dark })
    await StatusBar.setBackgroundColor({ color: '#16130F' })
  } catch {
    /* optional on web preview */
  }
}

/** Call once the React app is interactive. */
export async function hideNativeSplash() {
  if (!IS_IOS || splashHidden) return
  splashHidden = true
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen')
    await SplashScreen.hide()
  } catch {
    /* ignore */
  }
}

export async function setNativeStatusBarStyle(style = 'dark') {
  if (!IS_IOS) return
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    await StatusBar.setStyle({
      style: style === 'light' ? Style.Light : Style.Dark,
    })
  } catch {
    /* ignore */
  }
}
