import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { startPwaRegistration } from './pwa/pwaController.js'
import './design/tokens.css'
import './redesign/redesign.css'
import './index.css'
import AppRouter from './app/AppRouter.jsx'
import { bootstrapNativeShell } from './native/bootstrapNativeShell.js'
import { initMobileViewportChrome } from './utils/mobileViewportChrome.js'
import { DEPLOY_EDGE_BUST } from './config/env.js'
import { recoverInterruptedBoot } from './pwa/staleChunkRecovery.js'
import { captureAttribution } from './lib/attribution.ts'
import { consumeAccessHandoff } from './lib/accessHandoff.js'
import {
  installGlobalErrorHandlers,
  installLcpSlowPageWatcher,
} from './lib/errorVisibility.js'

if (import.meta.env.DEV) {
  console.debug('[chronowalk] deploy edge bust', DEPLOY_EDGE_BUST)
}

// Mark / clear interrupted-boot sentinel, but never block React mount.
// Blocking mount left iOS Safari stuck on "Loading ChronoWalk…" forever when
// a recovery navigation did not start.
recoverInterruptedBoot()

// First-touch attribution before React / hash replaceState can drop query params.
captureAttribution()

// Global JS / promise errors + LCP slow_page (events no-op until PostHog ready).
installGlobalErrorHandlers()
installLcpSlowPageWatcher()

// Home Screen / standalone partitions often miss the tab that redeemed access.
// Hydrate from cw_h query or handoff cookie before any RequireAccess gate runs.
try {
  consumeAccessHandoff()
} catch {
  /* ignore */
}

// Production entry is the v2 redesign app only. The legacy LaunchRouter and the
// VITE_V2_APP / VITE_FIGMA_REDESIGN switches have been retired so no environment
// variable can boot an older generation of the app.
if (typeof document !== 'undefined') {
  document.documentElement.classList.add('redesign-pwa')
  initMobileViewportChrome()
  void bootstrapNativeShell()

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
  </StrictMode>,
)

// Register the service worker only after the UI is up - never during module
// evaluation, which raced poisoned controllers and blocked first paint.
// Currently disabled entirely via SERVICE_WORKER_BOOT_DISABLED.
if (typeof window !== 'undefined') {
  window.setTimeout(() => {
    void startPwaRegistration()
  }, 5000)
}
