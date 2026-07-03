import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './design/tokens.css'
import './index.css'
import AppRouter from './app/AppRouter.jsx'
import App from './App.jsx'
import './pwa/pwaController.js'

const useV2 = import.meta.env.VITE_V2_APP !== 'false'

function Root() {
  if (useV2) {
    return <AppRouter />
  }

  return <App />
}

if (!useV2 && typeof document !== 'undefined') {
  document.body.classList.add('legacy-v1')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>
)
