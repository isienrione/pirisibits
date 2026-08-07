import { useCallback, useEffect, useRef, useState } from 'react'
import {
  deleteRegion,
  downloadRegion,
  getRegionStatus,
  isSupported,
  openTestMap,
  subscribeOfflineMapProgress,
  OFFLINE_MAP_STATUS,
  ROME_OFFLINE_MAP_CONFIG,
} from '../../platform/offlineMaps/index.js'
import {
  formatOfflineMapProgress,
  formatOfflineMapResourceCount,
  shouldRenderOfflineMapTestPanel,
} from '../../platform/offlineMaps/offlineMapTestHarness.js'

const CITY_ID = ROME_OFFLINE_MAP_CONFIG.cityId
const POLL_MS = 750

const emptyStatus = () => ({
  cityId: CITY_ID,
  supported: false,
  status: OFFLINE_MAP_STATUS.NOT_DOWNLOADED,
  progress: null,
  completedResourceCount: null,
  requiredResourceCount: null,
  errorCode: null,
  errorMessage: null,
})

/**
 * DEV-only diagnostic panel for native offline Mapbox (Phase 1.5).
 * Isolates the native Mapbox renderer from the browser map path.
 */
export default function OfflineMapTestPanel() {
  const [open, setOpen] = useState(false)
  const [supportedInfo, setSupportedInfo] = useState({
    supported: false,
    platform: 'web',
  })
  const [status, setStatus] = useState(emptyStatus)
  const [busy, setBusy] = useState(null)
  const [lastAction, setLastAction] = useState(null)
  const [openResult, setOpenResult] = useState(null)
  const pollRef = useRef(null)

  const applyStatus = useCallback((next) => {
    setStatus({
      cityId: next?.cityId ?? CITY_ID,
      supported: Boolean(next?.supported),
      status: next?.status ?? OFFLINE_MAP_STATUS.NOT_DOWNLOADED,
      progress: next?.progress ?? null,
      completedResourceCount: next?.completedResourceCount ?? null,
      requiredResourceCount: next?.requiredResourceCount ?? null,
      errorCode: next?.errorCode ?? null,
      errorMessage: next?.errorMessage ?? null,
    })
  }, [])

  const refreshStatus = useCallback(async () => {
    const [support, region] = await Promise.all([
      isSupported(),
      getRegionStatus({ cityId: CITY_ID }),
    ])
    setSupportedInfo(support)
    applyStatus(region)
    return region
  }, [applyStatus])

  const stopPolling = useCallback(() => {
    if (pollRef.current != null) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const startPolling = useCallback(() => {
    stopPolling()
    pollRef.current = setInterval(() => {
      void refreshStatus().then((region) => {
        if (
          region?.status === OFFLINE_MAP_STATUS.DOWNLOADED ||
          region?.status === OFFLINE_MAP_STATUS.FAILED ||
          region?.status === OFFLINE_MAP_STATUS.NOT_DOWNLOADED
        ) {
          // Keep polling only while downloading; caller clears busy when download settles.
        }
      })
    }, POLL_MS)
  }, [refreshStatus, stopPolling])

  useEffect(() => {
    if (!shouldRenderOfflineMapTestPanel()) return undefined
    void refreshStatus()
    const unsubscribe = subscribeOfflineMapProgress((payload) => {
      if (payload?.cityId && payload.cityId !== CITY_ID) return
      applyStatus(payload)
    })
    return () => {
      unsubscribe()
      stopPolling()
    }
  }, [applyStatus, refreshStatus, stopPolling])

  if (!shouldRenderOfflineMapTestPanel()) return null

  const onCheckStatus = async () => {
    setBusy('status')
    setLastAction(null)
    try {
      await refreshStatus()
      setLastAction('status_ok')
    } finally {
      setBusy(null)
    }
  }

  const onDownload = async () => {
    setBusy('download')
    setLastAction(null)
    applyStatus({
      ...status,
      status: OFFLINE_MAP_STATUS.DOWNLOADING,
      errorCode: null,
      errorMessage: null,
    })
    startPolling()
    try {
      const result = await downloadRegion({ cityId: CITY_ID })
      applyStatus(result)
      setLastAction(
        result.status === OFFLINE_MAP_STATUS.DOWNLOADED
          ? 'download_ok'
          : 'download_failed',
      )
    } finally {
      stopPolling()
      await refreshStatus()
      setBusy(null)
    }
  }

  const onOpenNativeMap = async () => {
    setBusy('open')
    setLastAction(null)
    setOpenResult(null)
    try {
      const result = await openTestMap({ cityId: CITY_ID })
      setOpenResult(result)
      setLastAction(result.opened ? 'open_ok' : 'open_failed')
    } finally {
      setBusy(null)
    }
  }

  const onDelete = async () => {
    setBusy('delete')
    setLastAction(null)
    try {
      const result = await deleteRegion({ cityId: CITY_ID })
      applyStatus(result)
      setLastAction('delete_ok')
    } finally {
      setBusy(null)
    }
  }

  const buttonStyle = {
    minHeight: 32,
    padding: '4px 8px',
    border: '1px solid #686e72',
    borderRadius: 4,
    background: '#17212b',
    color: '#f7f3ec',
    cursor: busy ? 'wait' : 'pointer',
    fontSize: 12,
  }

  return (
    <div
      data-testid="offline-map-test-panel"
      style={{
        position: 'fixed',
        left: 8,
        bottom: 8,
        zIndex: 9998,
        maxWidth: 300,
        fontFamily: 'system-ui, sans-serif',
        fontSize: 12,
        lineHeight: 1.4,
        color: '#f7f3ec',
      }}
    >
      <button
        type="button"
        data-testid="offline-map-test-toggle"
        onClick={() => setOpen((value) => !value)}
        style={{
          ...buttonStyle,
          background: open ? '#a8742a' : '#17212b',
          borderColor: open ? '#d4af37' : '#686e72',
          marginBottom: open ? 6 : 0,
        }}
      >
        Offline Map Test
      </button>

      {open ? (
        <div
          data-testid="offline-map-test-body"
          style={{
            padding: 10,
            background: 'rgba(0,0,0,0.88)',
            borderRadius: 8,
            border: '1px solid #3a4450',
          }}
        >
          <p style={{ margin: '0 0 8px', fontWeight: 700 }}>Offline Map Test</p>
          <p style={{ margin: '0 0 4px' }} data-testid="offline-map-supported">
            Supported: {supportedInfo.supported ? 'yes' : 'no'} ({supportedInfo.platform})
          </p>
          <p style={{ margin: '0 0 4px' }} data-testid="offline-map-region">
            Region: {CITY_ID}
          </p>
          <p style={{ margin: '0 0 4px' }} data-testid="offline-map-status">
            Status: {status.status}
          </p>
          <p style={{ margin: '0 0 4px' }} data-testid="offline-map-progress">
            Progress: {formatOfflineMapProgress(status.progress)}
          </p>
          <p style={{ margin: '0 0 4px' }} data-testid="offline-map-completed">
            Completed resources:{' '}
            {formatOfflineMapResourceCount(status.completedResourceCount)}
          </p>
          <p style={{ margin: '0 0 8px' }} data-testid="offline-map-required">
            Required resources:{' '}
            {formatOfflineMapResourceCount(status.requiredResourceCount)}
          </p>
          {status.errorCode ? (
            <p
              style={{ margin: '0 0 8px', color: '#f0a0a0' }}
              data-testid="offline-map-error"
            >
              Error: {status.errorCode}
              {status.errorMessage ? ` — ${status.errorMessage}` : ''}
            </p>
          ) : null}
          {openResult ? (
            <p
              style={{ margin: '0 0 8px', opacity: 0.9 }}
              data-testid="offline-map-open-result"
            >
              Open: {openResult.opened ? 'opened' : 'failed'}
              {openResult.renderer ? ` · ${openResult.renderer}` : ''}
              {openResult.errorCode ? ` · ${openResult.errorCode}` : ''}
            </p>
          ) : null}
          {lastAction ? (
            <p
              style={{ margin: '0 0 8px', opacity: 0.75 }}
              data-testid="offline-map-last-action"
            >
              Last: {lastAction}
            </p>
          ) : null}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            <button
              type="button"
              data-testid="offline-map-check-status"
              disabled={Boolean(busy)}
              onClick={() => void onCheckStatus()}
              style={buttonStyle}
            >
              Check Status
            </button>
            <button
              type="button"
              data-testid="offline-map-download"
              disabled={Boolean(busy)}
              onClick={() => void onDownload()}
              style={buttonStyle}
            >
              Download Rome
            </button>
            <button
              type="button"
              data-testid="offline-map-open"
              disabled={Boolean(busy)}
              onClick={() => void onOpenNativeMap()}
              style={buttonStyle}
            >
              Open Native Rome Map
            </button>
            <button
              type="button"
              data-testid="offline-map-delete"
              disabled={Boolean(busy)}
              onClick={() => void onDelete()}
              style={buttonStyle}
            >
              Delete Rome Map
            </button>
          </div>
          <p style={{ margin: '8px 0 0', opacity: 0.7, fontSize: 11 }}>
            Status comes from native TileStore — not localStorage. After download,
            force-quit, disable Simulator network, relaunch, Check Status, then
            Open Native Rome Map.
          </p>
        </div>
      ) : null}
    </div>
  )
}
