import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePwaInstall } from '../../hooks/usePwaInstall.js'
import { useOfflineAudio } from '../../hooks/useOfflineAudio.js'
import { getAnalyticsConsent, setAnalyticsConsent } from '../../lib/track.js'
import RedesignRouteShell from '../RedesignRouteShell.jsx'
import B2MakeItYours from '../screens/B2MakeItYours.jsx'

export default function RedesignSetupPage() {
  const navigate = useNavigate()
  const {
    canPromptInstall,
    showIosInstructions,
    needsSafariForInstall,
    promptInstall,
  } = usePwaInstall()
  const offline = useOfflineAudio()
  const [analyticsEnabled, setAnalyticsEnabled] = useState(
    () => getAnalyticsConsent() === 'accepted',
  )

  const finishSetup = useCallback(() => {
    // Persist an explicit choice so we never re-prompt with a global banner.
    if (getAnalyticsConsent() == null) {
      setAnalyticsConsent(false)
      setAnalyticsEnabled(false)
    }
    navigate('/begin', { replace: true })
  }, [navigate])

  const handleInstall = async () => {
    if (canPromptInstall) {
      await promptInstall()
      return
    }
    // iOS has no native install prompt — primary CTA means "I've done Share → Add".
    if (showIosInstructions) {
      finishSetup()
    }
  }

  const handleDownload = () => {
    if (!offline.isDownloading && !offline.isReady) {
      void offline.startDownload()
    }
  }

  const handleAnalyticsChange = useCallback((enabled) => {
    setAnalyticsEnabled(enabled)
    setAnalyticsConsent(enabled)
  }, [])

  const downloadProgress =
    offline.progress?.percent != null ? offline.progress.percent / 100 : offline.isReady ? 1 : 0

  return (
    <RedesignRouteShell>
      <div className="redesign-app-shell">
        <B2MakeItYours
          showIosInstructions={showIosInstructions}
          needsSafariForInstall={needsSafariForInstall}
          canInstall={canPromptInstall || showIosInstructions}
          downloading={offline.isDownloading}
          downloadProgress={downloadProgress}
          downloadComplete={offline.isReady}
          analyticsEnabled={analyticsEnabled}
          onInstall={handleInstall}
          onDownload={handleDownload}
          onAnalyticsChange={handleAnalyticsChange}
          onContinue={finishSetup}
          onSkip={finishSetup}
        />
      </div>
    </RedesignRouteShell>
  )
}
