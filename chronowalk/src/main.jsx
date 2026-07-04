import { StrictMode, useCallback, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import SplashScreen from './components/SplashScreen.jsx'
import JourneyDevPanel from './components/dev/JourneyDevPanel.jsx'
import './pwa/pwaController.js'

function Root() {
  const [showSplash, setShowSplash] = useState(true)
  const handleSplashComplete = useCallback(() => setShowSplash(false), [])

  return (
    <>
      <App />
      {showSplash ? <SplashScreen onComplete={handleSplashComplete} /> : null}
      {import.meta.env.DEV ? <JourneyDevPanel /> : null}
    </>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
