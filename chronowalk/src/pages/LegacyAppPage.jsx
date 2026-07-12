import { useCallback, useState } from 'react'
import App from '../App.jsx'
import SplashScreen from '../components/SplashScreen.jsx'
import JourneyDevPanel from '../components/dev/JourneyDevPanel.jsx'
import ContinueWalkingTransition from '../components/journey/ContinueWalkingTransition.jsx'

export default function LegacyAppPage() {
  const [showSplash, setShowSplash] = useState(true)
  const handleSplashComplete = useCallback(() => setShowSplash(false), [])

  return (
    <>
      <App />
      {showSplash ? <SplashScreen onComplete={handleSplashComplete} /> : null}
      <ContinueWalkingTransition />
      {import.meta.env.DEV ? <JourneyDevPanel /> : null}
    </>
  )
}
