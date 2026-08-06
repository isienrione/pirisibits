import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ChronoWalkLogo from '../components/ui/ChronoWalkLogo.jsx'
import { PrimaryButton } from '../redesign/ui/PrimaryButton.jsx'
import { GhostButton } from '../redesign/ui/GhostButton.jsx'
import { T, F } from '../redesign/tokens.js'
import { getDownloadService } from '../downloads/index.js'
import { getPurchaseService } from '../purchases/index.js'
import { getNativeEntryModel } from './nativeEntryRouting.js'
import { NativeProductList } from './NativeProductList.jsx'
import './nativeEntry.css'

/**
 * Native city home — product-first app experience (not the marketing landing).
 *
 * @param {{
 *   model?: ReturnType<typeof getNativeEntryModel>,
 *   purchaseService?: ReturnType<typeof getPurchaseService>,
 *   downloadService?: ReturnType<typeof getDownloadService>,
 *   onExploreProducts?: () => void,
 * }} [props]
 */
export function NativeCityHome({
  model: modelProp,
  purchaseService,
  downloadService,
  onExploreProducts,
} = {}) {
  const navigate = useNavigate()
  const model = modelProp ?? getNativeEntryModel()
  const city = model.city
  const [downloadStatus, setDownloadStatus] = useState(null)
  const [restoreMessage, setRestoreMessage] = useState(null)
  const [restoreBusy, setRestoreBusy] = useState(false)

  const purchases = purchaseService ?? getPurchaseService()
  const downloads = downloadService ?? getDownloadService()

  const primaryProductId = useMemo(() => {
    const complete = model.products?.find((p) => p.productId === 'rome-complete')
    return complete?.productId ?? model.products?.[0]?.productId ?? null
  }, [model.products])

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

  const offlineLabel = useMemo(() => {
    if (!downloadStatus) return 'Offline pack ready when downloaded'
    if (downloadStatus.status === 'ready') return 'Available offline'
    if (downloadStatus.status === 'downloading') return 'Downloading for offline…'
    if (downloadStatus.status === 'update_available') return 'Update available for offline pack'
    return 'Available offline after download'
  }, [downloadStatus])

  const handleContinue = useCallback(() => {
    if (model.continueWalk?.path) navigate(model.continueWalk.path)
  }, [model.continueWalk, navigate])

  const handleExplore = useCallback(() => {
    if (onExploreProducts) onExploreProducts()
    else navigate('#products')
  }, [navigate, onExploreProducts])

  const handleFreePreview = useCallback(() => {
    if (model.freePreviewPath) navigate(model.freePreviewPath)
  }, [model.freePreviewPath, navigate])

  const handleRestore = useCallback(async () => {
    setRestoreBusy(true)
    setRestoreMessage(null)
    try {
      // Always use PurchaseService restore (StoreKit on iOS). Never Paddle.
      const result = await purchases.restorePurchases()
      if (result?.ok) {
        const count = result.candidates?.length ?? result.entitlements?.length ?? 0
        setRestoreMessage(
          count > 0
            ? `Found ${count} purchase candidate${count === 1 ? '' : 's'}. Server verification comes next.`
            : 'No Apple purchases found to restore yet.',
        )
      } else {
        setRestoreMessage(
          result?.message ||
            result?.code ||
            'Restore is unavailable until StoreKit is configured in Xcode.',
        )
      }
    } catch (err) {
      setRestoreMessage(err?.message || 'Restore failed')
    } finally {
      setRestoreBusy(false)
    }
  }, [purchases])

  if (!city) {
    return (
      <div className="cw-native-entry" data-testid="native-city-home-empty">
        <p className="cw-native-entry__muted">No city selected.</p>
      </div>
    )
  }

  return (
    <div className="cw-native-entry" data-testid="native-city-home">
      <header className="cw-native-entry__brand">
        <ChronoWalkLogo variant="dark" layout="horizontal" width={160} />
        <p className="cw-native-entry__eyebrow">Your walks</p>
      </header>

      <section className="cw-native-entry__city-card" aria-label={`${city.name} city`}>
        <p className="cw-native-entry__eyebrow">{city.name}</p>
        <h1 className="cw-native-entry__title">Walk {city.name}</h1>
        <p className="cw-native-entry__body">
          Self-guided audio walks. Download once, then wander offline.
        </p>
        <p className="cw-native-entry__offline" data-testid="native-offline-status">
          {offlineLabel}
        </p>
      </section>

      <div className="cw-native-entry__actions">
        {model.continueWalk?.available ? (
          <PrimaryButton onClick={handleContinue} data-testid="native-continue-walk">
            Continue current walk
          </PrimaryButton>
        ) : null}

        <PrimaryButton
          onClick={handleExplore}
          color={T.gold}
          data-testid="native-explore-city"
        >
          Explore {city.name}
        </PrimaryButton>

        {model.freePreviewPath ? (
          <GhostButton onClick={handleFreePreview} data-testid="native-free-preview">
            Try the Pantheon stop free
          </GhostButton>
        ) : null}

        <GhostButton
          onClick={handleRestore}
          data-testid="native-restore-purchases"
          style={{ opacity: restoreBusy ? 0.7 : 1 }}
        >
          {restoreBusy ? 'Restoring…' : 'Restore Purchases'}
        </GhostButton>
      </div>

      {restoreMessage ? (
        <p className="cw-native-entry__status" role="status">
          {restoreMessage}
        </p>
      ) : null}

      <style>{`
        .cw-native-entry__title { font-family: ${F.display}; }
        .cw-native-entry__body, .cw-native-entry__eyebrow, .cw-native-entry__offline, .cw-native-entry__status {
          font-family: ${F.body};
        }
      `}</style>
    </div>
  )
}
