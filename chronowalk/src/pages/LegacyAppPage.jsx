import { useCallback, useState } from 'react'
import App from '../App.jsx'
import SplashScreen from '../components/SplashScreen.jsx'

/** Legacy ChronoWalk experience preserved at /legacy */
export default function LegacyAppPage() {
  const [showSplash, setShowSplash] = useState(true)
  const handleSplashComplete = useCallback(() => setShowSplash(false), [])

  return (
    <>
      <App />
      {showSplash ? <SplashScreen onComplete={handleSplashComplete} /> : null}
    </>
  )
}
