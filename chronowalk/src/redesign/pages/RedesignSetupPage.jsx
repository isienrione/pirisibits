import { useCallback, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { usePwaInstall } from '../../hooks/usePwaInstall.js'
import { useOfflineAudio } from '../../hooks/useOfflineAudio.js'
import { getAnalyticsConsent, setAnalyticsConsent } from '../../lib/track.js'
import {
  isAppEntryComplete,
  markAppEntryComplete,
  packBlurbForPurchasedTier,
  packTitleForPurchasedTier,
} from '../../lib/appEntry.js'
import { readPurchasedTier } from '../../lib/pendingPurchase.js'
import RedesignRouteShell from '../RedesignRouteShell.jsx'
import AppEntryThreshold from '../screens/AppEntryThreshold.jsx'
import AppEntryPrepare from '../screens/AppEntryPrepare.jsx'
import AppEntryFamily from '../screens/AppEntryFamily.jsx'

/**
 * App Entry — replaces the old marketing-adjacent setup checklist.
 * threshold → prepare → family → /begin
 */
export default function RedesignSetupPage() {
  const navigate = useNavigate()
  const purchasedTier = readPurchasedTier()
  const { installed, canPromptInstall, showIosInstructions, promptInstall } = usePwaInstall()
  const offline = useOfflineAudio()
  const [step, setStep] = useState('threshold')
  const [showIosHelp, setShowIosHelp] = useState(false)
  const [analyticsEnabled, setAnalyticsEnabled] = useState(
    () => getAnalyticsConsent() === 'accepted',
  )

  const finishEntry = useCallback(() => {
    if (getAnalyticsConsent() == null) {
      setAnalyticsConsent(false)
      setAnalyticsEnabled(false)
    }
    markAppEntryComplete()
    navigate('/begin', { replace: true })
  }, [navigate])

  const handleInstall = async () => {
    if (showIosInstructions) {
      setShowIosHelp(true)
      return
    }
    if (canPromptInstall) {
      await promptInstall()
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

  if (isAppEntryComplete()) {
    return <Navigate to="/begin" replace />
  }

  const downloadProgress =
    offline.progress?.percent != null ? offline.progress.percent / 100 : offline.isReady ? 1 : 0

  return (
    <RedesignRouteShell>
      <div className="redesign-app-shell">
        {step === 'threshold' ? (
          <AppEntryThreshold
            packTitle={packTitleForPurchasedTier(purchasedTier)}
            packBlurb={packBlurbForPurchasedTier(purchasedTier)}
            installed={installed}
            canPromptInstall={canPromptInstall}
            showIosInstructions={showIosInstructions || showIosHelp}
            onInstall={handleInstall}
            onContinue={() => setStep('prepare')}
          />
        ) : null}

        {step === 'prepare' ? (
          <AppEntryPrepare
            downloading={offline.isDownloading}
            downloadProgress={downloadProgress}
            downloadComplete={offline.isReady}
            analyticsEnabled={analyticsEnabled}
            onDownload={handleDownload}
            onAnalyticsChange={handleAnalyticsChange}
            onContinue={() => setStep('family')}
          />
        ) : null}

        {step === 'family' ? <AppEntryFamily onSkip={finishEntry} /> : null}
      </div>
    </RedesignRouteShell>
  )
}
