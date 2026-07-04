import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import LaunchRouter from './routes/LaunchRouter.jsx'
import { applyTextSizePreference } from './utils/appPreferences'
import './pwa/pwaController.js'

applyTextSizePreference()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LaunchRouter />
  </StrictMode>,
)
