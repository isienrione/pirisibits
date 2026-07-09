import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './design/tokens.css'
import './redesign/redesign.css'
import './index.css'
import AppRouter from './app/AppRouter.jsx'
import './pwa/pwaController.js'
import { ensureFreshBuild } from './pwa/ensureFreshBuild.js'

// Production entry is the v2 redesign app only. The legacy LaunchRouter and the
// VITE_V2_APP / VITE_FIGMA_REDESIGN switches have been retired so no environment
// variable can boot an older generation of the app.
if (typeof document !== 'undefined') {
  document.documentElement.classList.add('redesign-pwa')
}

async function bootstrap() {
  if (import.meta.env.PROD) {
    const { migrating } = await ensureFreshBuild()
    if (migrating) return
  }

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <AppRouter />
    </StrictMode>,
  )
}

void bootstrap()
