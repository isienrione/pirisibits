import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { pwaReady } from './pwa/pwaController.js'
import './design/tokens.css'
import './redesign/redesign.css'
import './index.css'
import AppRouter from './app/AppRouter.jsx'

// Production entry is the v2 redesign app only. The legacy LaunchRouter and the
// VITE_V2_APP / VITE_FIGMA_REDESIGN switches have been retired so no environment
// variable can boot an older generation of the app.
if (typeof document !== 'undefined') {
  document.documentElement.classList.add('redesign-pwa')
  const standalone =
    window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator.standalone === true
  if (!standalone) {
    document.documentElement.style.setProperty('--wc-browser-chrome', '52px')
  }
}

async function boot() {
  await pwaReady

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <AppRouter />
    </StrictMode>
  )
}

void boot()
