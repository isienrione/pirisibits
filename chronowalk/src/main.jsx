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
  initMobileViewportChrome()

  /** Pause decorative CSS when the tab is hidden — no visual change when visible. */
  const syncHiddenFlag = () => {
    document.documentElement.dataset.cwHidden = document.hidden ? 'true' : 'false'
  }
  syncHiddenFlag()
  document.addEventListener('visibilitychange', syncHiddenFlag)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>
)
