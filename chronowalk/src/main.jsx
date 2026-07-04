import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import LaunchRouter from './routes/LaunchRouter.jsx'
import './pwa/pwaController.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LaunchRouter />
  </StrictMode>,
)
