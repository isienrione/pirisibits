import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { usePwaInstall } from '../../hooks/usePwaInstall.js'
import { useOfflineAudio } from '../../hooks/useOfflineAudio.js'
import { getAnalyticsConsent, setAnalyticsConsent } from '../../lib/track.js'
import { syncAccessHandoff } from '../../lib/accessHandoff.js'
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
 * App Entry - replaces the old marketing-adjacent setup checklist.
 * threshold → prepare → family → /begin
 */
export default function RedesignSetupPage() {
  const navigate = useNavigate()
  const purchasedTier = readPurchasedTier()
  const { installed, canPromptInstall, showIosInstructions, promptInstall } = usePwaInstall()
  const offline = useOfflineAudio()
  // Land on prepare (offline + A2HS) - the screen travelers expect before the tour.
  // Threshold pack splash remains reachable only if we add an explicit back later.
  const [step, setStep] = useState('prepare')
  const [showIosHelp, setShowIosHelp] = useState(false)
  const [analyticsEnabled, setAnalyticsEnabled] = useState(() => {
    const consent = getAnalyticsConsent()
    // Unset → on by default (Help improve ChronoWalk). Explicit decline stays off.
    if (consent === 'declined') return false
    return true
  })
  const finishedEntryRef = useRef(false)

  // Persist the prepare-screen default (on) so finishEntry does not treat unset as decline.
  useEffect(() => {
    if (getAnalyticsConsent() == null) {
      setAnalyticsConsent(true)
    }
  }, [])

  // Keep Home Screen handoff warm while the traveler is on prepare.
  useEffect(() => {
    syncAccessHandoff({ updateUrl: true })
  }, [])

  const finishEntry = useCallback(() => {
    if (finishedEntryRef.current) return
    finishedEntryRef.current = true
    if (getAnalyticsConsent() == null) {
      setAnalyticsConsent(true)
      setAnalyticsEnabled(true)
    }
    markAppEntryComplete()
    navigate('/begin', { replace: true })
  }, [navigate])

  const handleInstall = async () => {
    syncAccessHandoff({ updateUrl: true })
    if (showIosInstructions) {
      setShowIosHelp(true)
      return
    }
    if (canPromptInstall) {
      await promptInstall()
    }
  }

  const handleDownload = () => {
    if (offline.isDownloading) return
    // Allow re-run when stories are ready but the map pack is incomplete.
    if (offline.isReady && offline.status?.error !== 'map_tiles_partial') return
    void offline.startDownload()
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
            downloadError={offline.error}
            mapTilesPartial={offline.status?.error === 'map_tiles_partial'}
            analyticsEnabled={analyticsEnabled}
            installed={installed}
            canPromptInstall={canPromptInstall}
            showIosInstructions={showIosInstructions || showIosHelp}
            onDownload={handleDownload}
            onInstall={handleInstall}
            onAnalyticsChange={handleAnalyticsChange}
            onContinue={() => setStep('family')}
          />
        ) : null}

        {step === 'family' ? <AppEntryFamily onSkip={finishEntry} /> : null}
      </div>
    </RedesignRouteShell>
  )
}
