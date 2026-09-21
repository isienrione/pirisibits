import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { IS_IOS } from '../../lib/platform.js'
import { setNativeStatusBarStyle } from '../../native/bootstrapNativeShell.js'

/** Light surfaces (home, legal) vs dark immersive journey chrome. */
const LIGHT_PATHS = new Set([
  '/home',
  '/tour',
  '/map',
  '/journal',
  '/letter',
  '/settings',
  '/contact',
  '/legal/privacy',
  '/begin',
  '/setup',
])

/**
 * Sync Capacitor StatusBar style to the active route (iOS only).
 */
export default function IosStatusBarSync() {
  const { pathname } = useLocation()

  useEffect(() => {
    if (!IS_IOS) return
    const light =
      LIGHT_PATHS.has(pathname) ||
      pathname.startsWith('/journal/') ||
      pathname.startsWith('/legal/')
    void setNativeStatusBarStyle(light ? 'dark' : 'light')
  }, [pathname])

  return null
}
