import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './design/tokens.css'
import './redesign/redesign.css'
import './index.css'
import AppRouter from './app/AppRouter.jsx'
import './pwa/pwaController.js'

const useV2 = import.meta.env.VITE_V2_APP === 'true'
const useFigmaRedesign = import.meta.env.VITE_FIGMA_REDESIGN !== 'false'
const LaunchRouter = lazy(() => import('./routes/LaunchRouter.jsx'))

function Root() {
  if (useV2) {
    return <AppRouter />
  }

  return (
    <Suspense fallback={null}>
      <LaunchRouter />
    </Suspense>
  )
}

if (!useV2 && typeof document !== 'undefined') {
  document.body.classList.add('legacy-v1')
}

if (useV2 && useFigmaRedesign && typeof document !== 'undefined') {
  document.documentElement.classList.add('redesign-pwa')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
