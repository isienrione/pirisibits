import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './pwa/pwaController.js'
import './design/tokens.css'
import './redesign/redesign.css'
import './index.css'
import AppRouter from './app/AppRouter.jsx'
import { initMobileViewportChrome } from './utils/mobileViewportChrome.js'
import { DEPLOY_EDGE_BUST } from './config/env.js'
import { recoverInterruptedBoot } from './pwa/staleChunkRecovery.js'

if (import.meta.env.DEV) {
  console.debug('[chronowalk] deploy edge bust', DEPLOY_EDGE_BUST)
}

// If the previous paint died mid-boot (common after a deploy on iOS Safari),
// purge the poisoned service-worker shell before mounting React. Access keys
// and journey progress in localStorage stay put.
const recoveringBoot = recoverInterruptedBoot()

// Production entry is the v2 redesign app only. The legacy LaunchRouter and the
// VITE_V2_APP / VITE_FIGMA_REDESIGN switches have been retired so no environment
// variable can boot an older generation of the app.
if (!recoveringBoot && typeof document !== 'undefined') {
  document.documentElement.classList.add('redesign-pwa')
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

if (!recoveringBoot) {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <AppRouter />
    </StrictMode>,
  )
}
