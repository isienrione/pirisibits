import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getDebugGeoPlacement, isDebugGeo, isDevPanelEnabled, isSimulateRome, isSimulateRomeTrack } from '../../config/env.js'
import { setDevSimulateGps } from '../dev/devTools.js'
import { useJourneyStep } from '../../hooks/useJourneyStep.js'
import { useTourManifest, useV2Journey } from '../../hooks/useV2Journey.js'
import { resolveDebugWaypointId } from '../../lib/debugWaypoint.js'
import { jumpToWaypointInJourney } from '../../lib/jumpToWaypoint.js'

const PANEL_OPEN_KEY = 'cw_v2_field_panel_open'

const STAGING_WAYPOINTS = [
  { label: 'Colosseum', id: 'colosseum' },
  { label: 'Pantheon', id: 'pantheon' },
  { label: 'Navona', id: 'piazza-navona' },
  { label: 'Capitoline', id: 'capitoline-hill' },
  { label: 'Trevi', id: 'fontana-di-trevi' },
  { label: 'Castel', id: 'castel-sant-angelo' },
]

function readPanelOpen() {
  if (typeof window === 'undefined') return false
  return window.sessionStorage.getItem(PANEL_OPEN_KEY) === '1'
}

function writePanelOpen(open) {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(PANEL_OPEN_KEY, open ? '1' : '0')
}

/** Collapsible QA panel — only when ?devPanel=true (not auto with geo_debug). */
export default function V2FieldTestPanel() {
  const navigate = useNavigate()
  const location = useLocation()
  const { manifest } = useTourManifest()
  const { state, context } = useV2Journey()
  const [open, setOpen] = useState(readPanelOpen)

  const step = useJourneyStep(
    manifest,
    context.path,
    context.currentSequenceIndex,
    context.promotedOptionalIds,
  )

  const activeLabel = useMemo(() => {
    if (step?.type === 'waypoint' && step.record?.title) return step.record.title
    if (step?.targetWaypoint?.title) return `→ ${step.targetWaypoint.title}`
    return '—'
  }, [step])

  if (!isDevPanelEnabled()) return null

  const setOpenState = (next) => {
    writePanelOpen(next)
    setOpen(next)
  }

  const mergeSearch = (updates) => {
    const params = new URLSearchParams(location.search)
    Object.entries(updates).forEach(([key, value]) => {
      if (value == null) params.delete(key)
      else params.set(key, value)
    })
    navigate({ pathname: location.pathname, search: `?${params.toString()}` }, { replace: true })
  }

  const jumpToStop = (slug) => {
    if (!manifest) return
    const waypointId = resolveDebugWaypointId(slug, manifest)
    if (!waypointId) return

    jumpToWaypointInJourney(manifest, waypointId, context, state)
    navigate('/journey', { replace: true })
  }

  const chipStyle = {
    minHeight: 32,
    padding: '6px 10px',
    border: '1px solid #686e72',
    borderRadius: 8,
    background: '#17212b',
    color: '#f5efe3',
    cursor: 'pointer',
    fontSize: 11,
    touchAction: 'manipulation',
  }

  if (!open) {
    return (
      <button
        type="button"
        data-testid="v2-field-test-toggle"
        aria-label="Open field test panel"
        onClick={() => setOpenState(true)}
        style={{
          position: 'fixed',
          top: 'max(10px, env(safe-area-inset-top))',
          right: 10,
          zIndex: 70,
          minHeight: 32,
          padding: '6px 12px',
          borderRadius: 999,
          border: '1px solid rgba(232,161,60,0.5)',
          background: 'rgba(0,0,0,0.72)',
          color: '#e8a13c',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.12em',
          cursor: 'pointer',
          touchAction: 'manipulation',
          pointerEvents: 'auto',
        }}
      >
        DEV
      </button>
    )
  }

  return (
    <div
      data-testid="v2-field-test-panel"
      style={{
        position: 'fixed',
        top: 'max(10px, env(safe-area-inset-top))',
        right: 10,
        zIndex: 70,
        width: 'min(280px, calc(100vw - 20px))',
        maxHeight: 'min(42vh, 320px)',
        overflowY: 'auto',
        padding: 10,
        background: 'rgba(0,0,0,0.92)',
        color: '#f5efe3',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 11,
        lineHeight: 1.45,
        borderRadius: 12,
        border: '1px solid rgba(232,161,60,0.35)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
        pointerEvents: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <p style={{ margin: 0, fontWeight: 700, color: '#e8a13c' }}>Field test</p>
        <button
          type="button"
          aria-label="Close field test panel"
          onClick={() => setOpenState(false)}
          style={{
            ...chipStyle,
            minHeight: 28,
            padding: '2px 8px',
          }}
        >
          ✕
        </button>
      </div>

      <p style={{ margin: '0 0 8px' }}>
        GPS: {isSimulateRome()
          ? `simulated (rome${isSimulateRomeTrack() ? '-track' : ''})`
          : isDebugGeo()
            ? `simulated (${getDebugGeoPlacement()})`
            : 'live'}
        <br />
        Stop: {activeLabel}
        <br />
        State: {state}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {STAGING_WAYPOINTS.map((stop) => (
          <button key={stop.id} type="button" onClick={() => jumpToStop(stop.id)} style={chipStyle}>
            {stop.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <button type="button" onClick={() => setDevSimulateGps(true)} style={chipStyle}>
          At stop
        </button>
        <button type="button" onClick={() => setDevSimulateGps(false)} style={chipStyle}>
          Live GPS
        </button>
        <button
          type="button"
          onClick={() =>
            mergeSearch({ geo_debug: 'walking', debugStop: 'colosseum', resetTour: 'true' })
          }
          style={chipStyle}
        >
          Walk mode
        </button>
        <button
          type="button"
          onClick={() => mergeSearch({ geo_debug: 'true', debugStop: 'colosseum', resetTour: 'true' })}
          style={chipStyle}
        >
          Arrive
        </button>
      </div>
    </div>
  )
}
