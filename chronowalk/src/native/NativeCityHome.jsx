import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ChronoWalkLogo from '../components/ui/ChronoWalkLogo.jsx'
import { getDownloadService } from '../downloads/index.js'
import {
  getPurchaseService,
  activateLocalStoreKitEntitlementsFromRestore,
} from '../purchases/index.js'
import { getNativeEntryModel } from './nativeEntryRouting.js'
import {
  getNativeCityHeroSrc,
  getOfflineStatusPresentation,
  getRestorePresentation,
} from './nativeCopy.js'
import { NativeButton } from './NativeButton.jsx'
import { NativeSettings } from './NativeSettings.jsx'
import { isReducedMotionPreferred, nativeSuccessHaptic, nativeWarningHaptic } from './nativeHaptics.js'
import './nativeEntry.css'

/**
 * Polished native city home — first-viewport product experience.
 */
export function NativeCityHome({
  model: modelProp,
  purchaseService,
  downloadService,
  onExploreProducts,
  onOpenDownloads,
} = {}) {
  const navigate = useNavigate()
  const model = modelProp ?? getNativeEntryModel()
  const city = model.city
  const [downloadStatus, setDownloadStatus] = useState(null)
  const [online, setOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine !== false,
  )
  const [restoreBusy, setRestoreBusy] = useState(false)
  const [restoreResult, setRestoreResult] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const reducedMotion = isReducedMotionPreferred()

  const purchases = purchaseService ?? getPurchaseService()
  const downloads = downloadService ?? getDownloadService()

  const primaryProductId = useMemo(() => {
    const complete = model.products?.find((p) => p.productId === 'rome-complete')
    return complete?.productId ?? model.products?.[0]?.productId ?? null
  }, [model.products])

  useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadStatus() {
      if (!primaryProductId || typeof downloads?.getDownloadStatus !== 'function') {
        setDownloadStatus(null)
        return
      }
      try {
        const status = await downloads.getDownloadStatus(primaryProductId)
        if (!cancelled) setDownloadStatus(status)
      } catch {
        if (!cancelled) setDownloadStatus(null)
      }
    }
    void loadStatus()
    return () => {
      cancelled = true
    }
  }, [downloads, primaryProductId])

  const offline = useMemo(
    () => getOfflineStatusPresentation(downloadStatus, { online }),
    [downloadStatus, online],
  )

  const restoreView = useMemo(
    () => (restoreBusy ? getRestorePresentation(null) : getRestorePresentation(restoreResult)),
    [restoreBusy, restoreResult],
  )

  const handleContinue = useCallback(() => {
    if (model.continueWalk?.path) navigate(model.continueWalk.path)
  }, [model.continueWalk, navigate])

  const handleExplore = useCallback(() => {
    onExploreProducts?.()
  }, [onExploreProducts])

  const handleFreePreview = useCallback(() => {
    if (model.freePreviewPath) navigate(model.freePreviewPath)
  }, [model.freePreviewPath, navigate])

  const handleDownloads = useCallback(() => {
    if (onOpenDownloads) onOpenDownloads()
    else onExploreProducts?.()
  }, [onOpenDownloads, onExploreProducts])

  const handleRestore = useCallback(async () => {
    setRestoreBusy(true)
    setRestoreResult(null)
    try {
      const result = await purchases.restorePurchases()
      const local = activateLocalStoreKitEntitlementsFromRestore(result)
      if (local.ok) {
        setRestoreResult({
          ...result,
          ok: true,
          localActivated: true,
          activated: local.activated,
        })
        nativeSuccessHaptic()
      } else {
        setRestoreResult(result)
        if (result?.ok && (result.candidates?.length || result.entitlements?.length)) {
          nativeSuccessHaptic()
        } else if (!result?.ok) {
          nativeWarningHaptic()
        }
      }
    } catch {
      setRestoreResult({ ok: false, code: 'restore_failed' })
      nativeWarningHaptic()
    } finally {
      setRestoreBusy(false)
    }
  }, [purchases])

  if (!city) {
    return (
      <div
        className={`cw-native-shell cw-native-empty ${reducedMotion ? 'cw-native-shell--reduced' : 'cw-native-shell--motion'}`}
        data-testid="native-city-home-empty"
      >
        <div className="cw-native-shell__panel">
          <h1 className="cw-native-title">ChronoWalk</h1>
          <p className="cw-native-lede">No city is available right now.</p>
        </div>
      </div>
    )
  }

  const heroSrc = getNativeCityHeroSrc(city.cityId)
  const showComingSoon = (model.cities?.length ?? 1) <= 1

  return (
    <div
      className={`cw-native-shell ${reducedMotion ? 'cw-native-shell--reduced' : 'cw-native-shell--motion'}`}
      data-testid="native-city-home"
    >
      <div className="cw-native-home cw-native-shell__panel">
        <header className="cw-native-home__top">
          <div className="cw-native-home__brand-mark">
            <ChronoWalkLogo variant="dark" size={36} aria-hidden="true" />
            <p className="cw-native-home__brand-word">ChronoWalk</p>
          </div>
          <button
            type="button"
            className="cw-native-icon-btn"
            aria-label="Open settings"
            data-testid="native-open-settings"
            onClick={() => setSettingsOpen(true)}
          >
            Settings
          </button>
        </header>

        <section
          className="cw-native-home__hero"
          aria-label={`${city.name} cinematic preview`}
        >
          <img
            className="cw-native-home__hero-img"
            src={heroSrc}
            alt=""
            decoding="async"
          />
          <div className="cw-native-home__hero-veil" aria-hidden="true" />
          <div className="cw-native-home__hero-copy">
            <p className="cw-native-eyebrow">{city.name}</p>
            <h1 className="cw-native-title">Walk through {city.name} as it once was.</h1>
            <p className="cw-native-lede">
              Cinematic audio walks. Download once, then wander without the crowd.
            </p>
            <div className="cw-native-meta">
              <span
                className={`cw-native-chip cw-native-chip--${offline.tone}`}
                data-testid="native-offline-status"
                aria-live="polite"
              >
                {offline.label}
              </span>
              {model.continueWalk?.available ? (
                <span className="cw-native-chip" data-testid="native-progress-chip">
                  Walk in progress
                </span>
              ) : null}
            </div>
          </div>
        </section>

        <div className="cw-native-home__actions">
          {model.continueWalk?.available ? (
            <NativeButton
              variant="terracotta"
              testId="native-continue-walk"
              aria-label="Continue Walk"
              onClick={handleContinue}
            >
              Continue Walk
            </NativeButton>
          ) : null}

          <NativeButton
            variant="primary"
            testId="native-explore-city"
            aria-label={`Explore ${city.name}`}
            onClick={handleExplore}
          >
            Explore {city.name}
          </NativeButton>

          {model.freePreviewPath ? (
            <NativeButton
              variant="secondary"
              testId="native-free-preview"
              aria-label="Try the Pantheon stop free"
              onClick={handleFreePreview}
            >
              Try Pantheon Free
            </NativeButton>
          ) : null}

          <div className="cw-native-home__secondary">
            <NativeButton
              variant="ghost"
              testId="native-restore-purchases"
              aria-label={restoreBusy ? 'Restoring purchases' : 'Restore purchases'}
              disabled={restoreBusy}
              onClick={handleRestore}
            >
              {restoreBusy ? 'Restoring…' : 'Restore Purchases'}
            </NativeButton>
            <NativeButton
              variant="ghost"
              testId="native-downloads"
              aria-label="Downloads"
              onClick={handleDownloads}
            >
              Downloads
            </NativeButton>
          </div>
        </div>

        {(restoreBusy || restoreResult) && restoreView ? (
          <div
            className={`cw-native-status cw-native-status--${restoreView.kind}`}
            role="status"
            aria-live="polite"
            data-testid="native-restore-status"
          >
            <p className="cw-native-status__title">{restoreView.title}</p>
            <p className="cw-native-status__detail">{restoreView.detail}</p>
          </div>
        ) : null}

        {showComingSoon ? (
          <p className="cw-native-home__footnote" data-testid="native-more-cities">
            More cities coming
          </p>
        ) : null}
      </div>

      <NativeSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onRestore={handleRestore}
      />
    </div>
  )
}
