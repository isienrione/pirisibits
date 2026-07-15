import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './pwa/pwaController.js'
import './design/tokens.css'
import './redesign/redesign.css'
import './index.css'
import AppRouter from './app/AppRouter.jsx'
import { initMobileViewportChrome } from './utils/mobileViewportChrome.js'

// Production entry is the v2 redesign app only. The legacy LaunchRouter and the
// VITE_V2_APP / VITE_FIGMA_REDESIGN switches have been retired so no environment
// variable can boot an older generation of the app.
if (typeof document !== 'undefined') {
  document.documentElement.classList.add('redesign-pwa')
  // iOS home-screen PWAs report navigator.standalone before display-mode media matches.
  if (window.navigator?.standalone === true) {
    document.documentElement.classList.add('ios-standalone')
  }
  initMobileViewportChrome()

  const motionQuery =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null
  const syncReducedMotionClass = () => {
    document.documentElement.classList.toggle('cw-reduce-motion', Boolean(motionQuery?.matches))
  }
  syncReducedMotionClass()
  motionQuery?.addEventListener?.('change', syncReducedMotionClass)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>
)
