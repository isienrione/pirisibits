import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { usePwaInstall } from '../../hooks/usePwaInstall.js'
import { useOfflineAudio } from '../../hooks/useOfflineAudio.js'
import { syncAccessHandoff } from '../../lib/accessHandoff.js'
import {
  isAppEntryComplete,
  markAppEntryComplete,
  packBlurbForPurchasedTier,
  packTitleForPurchasedTier,
} from '../../lib/appEntry.js'
import { hasCompletedGuestOnboarding, hasGuestSession, markGuestOnboardingComplete } from '../../lib/guestSession.js'
import { hasValidLocalAccess } from '../../lib/accessSession.js'
import { isNativeIOS } from '../../lib/platform.js'
import { shouldSkipNativeA2hs } from '../../lib/nativeAppEntry.jsx'
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
  const skipA2hs = shouldSkipNativeA2hs()
  const offline = useOfflineAudio()
  // Land on prepare (offline + A2HS) - the screen travelers expect before the tour.
  // Threshold pack splash remains reachable only if we add an explicit back later.
  const [step, setStep] = useState('prepare')
  const [showIosHelp, setShowIosHelp] = useState(false)
  const finishedEntryRef = useRef(false)

  // Keep Home Screen handoff warm while the traveler is on prepare.
  useEffect(() => {
    syncAccessHandoff({ updateUrl: true })
  }, [])

  const finishEntry = useCallback(() => {
    if (finishedEntryRef.current) return
    finishedEntryRef.current = true
    markAppEntryComplete()
    markGuestOnboardingComplete()
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
    if (!offline.isDownloading && !offline.isReady) {
      void offline.startDownload()
    }
  }

  if (isNativeIOS() && !hasValidLocalAccess()) {
    if (hasCompletedGuestOnboarding()) return <Navigate to="/home" replace />
    if (hasGuestSession()) return <Navigate to="/context" replace />
    return <Navigate to="/welcome" replace />
  }

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
            installed={skipA2hs || installed}
            canPromptInstall={skipA2hs ? false : canPromptInstall}
            showIosInstructions={skipA2hs ? false : showIosInstructions || showIosHelp}
            onInstall={skipA2hs ? undefined : handleInstall}
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
            installed={installed}
            canPromptInstall={skipA2hs ? false : canPromptInstall}
            showIosInstructions={skipA2hs ? false : showIosInstructions || showIosHelp}
            hideA2hs={skipA2hs}
            onDownload={handleDownload}
            onInstall={skipA2hs ? undefined : handleInstall}
            onContinue={() => setStep('family')}
          />
        ) : null}

        {step === 'family' ? <AppEntryFamily onSkip={finishEntry} /> : null}
      </div>
    </RedesignRouteShell>
  )
}
