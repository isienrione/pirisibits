import { useCallback, useEffect, useState } from 'react'
import { collectDebugSnapshot } from '../../lib/collectDebugSnapshot.js'
import { subscribeDebugEvents } from '../../lib/debugEventLog.js'
import { subscribeMapboxInitStatus } from '../../lib/mapboxStatus.js'
import { closeDebugPanel } from './debugPanelGate.js'

const PANEL_STYLE = {
  position: 'fixed',
  right: 8,
  bottom: 8,
  zIndex: 100000,
  width: 'min(420px, calc(100vw - 16px))',
  maxHeight: 'min(70vh, 560px)',
  overflow: 'auto',
  padding: 12,
  background: 'rgba(11, 11, 13, 0.94)',
  color: '#FAF6EF',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  fontSize: 11,
  lineHeight: 1.45,
  borderRadius: 10,
  border: '1px solid rgba(250, 246, 239, 0.18)',
  boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
}

const BTN_STYLE = {
  minHeight: 32,
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid rgba(250, 246, 239, 0.28)',
  background: '#1A1A1F',
  color: '#FAF6EF',
  cursor: 'pointer',
  fontSize: 11,
}

function formatTs(ts) {
  try {
    return new Date(ts).toLocaleTimeString()
  } catch {
    return String(ts)
  }
}

/**
 * Live diagnostics overlay. Open via ?debug=1 or 5 rapid logo taps.
 */
export default function DebugPanel() {
  const [snapshot, setSnapshot] = useState(null)
  const [copyState, setCopyState] = useState('idle')
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    try {
      const next = await collectDebugSnapshot()
      setSnapshot(next)
      setError(null)
    } catch (err) {
      setError(err?.message || 'snapshot_failed')
    }
  }, [])

  useEffect(() => {
    void refresh()
    const timer = setInterval(() => {
      void refresh()
    }, 1000)
    const unsubEvents = subscribeDebugEvents(() => {
      void refresh()
    })
    const unsubMap = subscribeMapboxInitStatus(() => {
      void refresh()
    })
    return () => {
      clearInterval(timer)
      unsubEvents()
      unsubMap()
    }
  }, [refresh])

  const onCopy = useCallback(async () => {
    try {
      const data = snapshot || (await collectDebugSnapshot())
      const text = JSON.stringify(data, null, 2)
      await navigator.clipboard.writeText(text)
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 1600)
    } catch {
      setCopyState('failed')
      setTimeout(() => setCopyState('idle'), 2000)
    }
  }, [snapshot])

  const ph = snapshot?.posthog || {}
  const engagement = snapshot?.engagement || {}
  const events = snapshot?.recent_events || []

  return (
    <aside
      data-testid="cw-debug-panel"
      role="dialog"
      aria-label="ChronoWalk diagnostics"
      style={PANEL_STYLE}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: 10,
        }}
      >
        <strong style={{ fontSize: 12, letterSpacing: '0.04em' }}>CW DEBUG</strong>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" style={BTN_STYLE} onClick={() => void refresh()}>
            Refresh
          </button>
          <button type="button" style={BTN_STYLE} onClick={() => void onCopy()}>
            {copyState === 'copied'
              ? 'Copied'
              : copyState === 'failed'
                ? 'Copy failed'
                : 'Copy diagnostics'}
          </button>
          <button type="button" style={BTN_STYLE} onClick={closeDebugPanel} aria-label="Close debug panel">
            Close
          </button>
        </div>
      </div>

      {error ? <p style={{ color: '#E8A13C' }}>Error: {error}</p> : null}

      {!snapshot ? (
        <p>Loading…</p>
      ) : (
        <>
          <section style={{ marginBottom: 10 }}>
            <p style={{ margin: '0 0 4px', opacity: 0.7 }}>PostHog</p>
            <p style={{ margin: 0, wordBreak: 'break-all' }}>
              distinct_id: {ph.distinct_id ?? '—'}
            </p>
            <p style={{ margin: 0, wordBreak: 'break-all' }}>
              session_id: {ph.session_id ?? '—'}
            </p>
            <p style={{ margin: 0 }}>
              capture_enabled: {String(ph.capture_enabled)} · ready:{' '}
              {String(ph.analytics_ready)}
            </p>
          </section>

          <section style={{ marginBottom: 10 }}>
            <p style={{ margin: '0 0 4px', opacity: 0.7 }}>Session</p>
            <p style={{ margin: 0 }}>ab_variant: {String(snapshot.ab_variant)}</p>
            <p style={{ margin: 0 }}>
              scroll_depth_pct: {engagement.scroll_depth_pct} · seconds_on_page:{' '}
              {engagement.seconds_on_page}
            </p>
            <p style={{ margin: 0 }}>
              is_pwa: {String(engagement.is_pwa)} · is_ios: {String(engagement.is_ios)}
            </p>
            <p style={{ margin: 0 }}>service_worker: {String(snapshot.service_worker)}</p>
            <p style={{ margin: 0 }}>paddle: {String(snapshot.paddle)}</p>
            <p style={{ margin: 0 }}>
              mapbox: {snapshot.mapbox?.status}
              {snapshot.mapbox?.detail ? ` (${snapshot.mapbox.detail})` : ''}
            </p>
          </section>

          <section style={{ marginBottom: 10 }}>
            <p style={{ margin: '0 0 4px', opacity: 0.7 }}>Attribution</p>
            <pre
              style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                opacity: 0.95,
              }}
            >
              {JSON.stringify(snapshot.attribution, null, 2)}
            </pre>
          </section>

          <section>
            <p style={{ margin: '0 0 4px', opacity: 0.7 }}>
              Last {events.length} events
            </p>
            {events.length === 0 ? (
              <p style={{ margin: 0, opacity: 0.6 }}>None yet</p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {[...events].reverse().map((ev, index) => (
                  <li
                    key={`${ev.ts}-${ev.name}-${index}`}
                    style={{
                      marginBottom: 6,
                      paddingBottom: 6,
                      borderBottom: '1px solid rgba(250,246,239,0.08)',
                    }}
                  >
                    <div>
                      <strong>{ev.name}</strong>{' '}
                      <span style={{ opacity: 0.65 }}>{formatTs(ev.ts)}</span>
                    </div>
                    {ev.props && Object.keys(ev.props).length > 0 ? (
                      <div style={{ opacity: 0.85, wordBreak: 'break-word' }}>
                        {JSON.stringify(ev.props)}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </aside>
  )
}
