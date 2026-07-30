import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { loadRomeManifest } from '../../content/manifest.js'
import { setDevSimulateGps } from './devTools.js'
import { useV2Journey } from '../../hooks/useV2Journey.js'
import { useJourneyStep } from '../../hooks/useJourneyStep.js'
import { hasAccess } from '../../lib/config.js'
import {
  applyJourneyScenePreset,
  applyUxPersonaPreset,
  mergeSearchParams,
  UX_JOURNEY_SCENE_IDS,
  UX_PERSONA_IDS,
  UX_ROUTE_TARGETS,
} from './uxRegressionPresets.js'

const PANEL_OPEN_KEY = 'cw_ux_regression_panel_open'

const PERSONAS = [
  { id: UX_PERSONA_IDS.FIRST_TIME_VISITOR, label: 'First-time visitor' },
  { id: UX_PERSONA_IDS.PURCHASED_FIRST_TIME, label: 'Purchased · first open' },
  { id: UX_PERSONA_IDS.RETURNING_WITH_PROGRESS, label: 'Returning · in progress' },
]

const JOURNEY_SCENES = [
  { id: UX_JOURNEY_SCENE_IDS.WALKING, label: 'Walking' },
  { id: UX_JOURNEY_SCENE_IDS.APPROACHING, label: 'Approaching' },
  { id: UX_JOURNEY_SCENE_IDS.ARRIVED, label: 'Arrived' },
  { id: UX_JOURNEY_SCENE_IDS.STORY, label: 'Story' },
  { id: UX_JOURNEY_SCENE_IDS.THRESHOLD, label: 'Threshold' },
  { id: UX_JOURNEY_SCENE_IDS.AFTER_STORY, label: 'After story' },
  { id: UX_JOURNEY_SCENE_IDS.DAY_COMPLETE, label: 'Day complete' },
  { id: UX_JOURNEY_SCENE_IDS.FULL_COMPLETE, label: 'Full complete' },
  { id: UX_JOURNEY_SCENE_IDS.OFF_ROUTE, label: 'Off route' },
  { id: UX_JOURNEY_SCENE_IDS.MISSING_MEDIA, label: 'Missing media' },
  { id: UX_JOURNEY_SCENE_IDS.OFFLINE, label: 'Offline ready' },
]

function readPanelOpen() {
  if (typeof window === 'undefined') return false
  return window.sessionStorage.getItem(PANEL_OPEN_KEY) === '1'
}

function writePanelOpen(open) {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(PANEL_OPEN_KEY, open ? '1' : '0')
}

/** Dev-only UX regression tester · never mounted in production builds. */
export default function UxRegressionTester() {
  const navigate = useNavigate()
  const location = useLocation()
  const manifest = useMemo(() => loadRomeManifest(), [])
  const snapshot = useV2Journey()
  const { state, context } = snapshot
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
    return '-'
  }, [step])

  if (!import.meta.env.DEV) return null

  const setOpenState = (next) => {
    writePanelOpen(next)
    setOpen(next)
  }

  const go = ({ route, searchParams = {} }) => {
    const search = mergeSearchParams(location.search, searchParams)
    navigate({ pathname: route, search }, { replace: false })
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
        data-testid="ux-regression-toggle"
        aria-label="Open UX regression tester"
        onClick={() => setOpenState(true)}
        style={{
          position: 'fixed',
          top: 'max(10px, env(safe-area-inset-top))',
          right: 10,
          zIndex: 120,
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
        QA
      </button>
    )
  }

  return (
    <div
      data-testid="ux-regression-panel"
      style={{
        position: 'fixed',
        top: 'max(10px, env(safe-area-inset-top))',
        right: 10,
        zIndex: 120,
        width: 'min(320px, calc(100vw - 20px))',
        maxHeight: 'min(72vh, 560px)',
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
        <p style={{ margin: 0, fontWeight: 700, color: '#e8a13c' }}>UX regression</p>
        <button
          type="button"
          aria-label="Close UX regression tester"
          onClick={() => setOpenState(false)}
          style={{ ...chipStyle, minHeight: 28, padding: '2px 8px' }}
        >
          ✕
        </button>
      </div>

      <p style={{ margin: '0 0 8px', opacity: 0.9 }}>
        Access: {hasAccess() ? 'yes' : 'no'}
        <br />
        State: {state}
        <br />
        Stop: {activeLabel}
      </p>

      <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#e8a13c' }}>Personas</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {PERSONAS.map((persona) => (
          <button
            key={persona.id}
            type="button"
            data-testid={`ux-persona-${persona.id}`}
            onClick={() => go(applyUxPersonaPreset(manifest, persona.id))}
            style={chipStyle}
          >
            {persona.label}
          </button>
        ))}
      </div>

      <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#e8a13c' }}>Journey scenes</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {JOURNEY_SCENES.map((scene) => (
          <button
            key={scene.id}
            type="button"
            data-testid={`ux-scene-${scene.id}`}
            onClick={() => go(applyJourneyScenePreset(manifest, scene.id))}
            style={chipStyle}
          >
            {scene.label}
          </button>
        ))}
      </div>

      <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#e8a13c' }}>Routes</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {UX_ROUTE_TARGETS.map((route) => (
          <button
            key={route.id}
            type="button"
            onClick={() => go({ route: route.path, searchParams: {} })}
            style={chipStyle}
          >
            {route.label}
          </button>
        ))}
      </div>

      <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#e8a13c' }}>GPS helpers</p>
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
            go({
              route: '/journey',
              searchParams: { geo_debug: 'walking', debugStop: 'colosseum' },
            })
          }
          style={chipStyle}
        >
          Walk mode
        </button>
        <button
          type="button"
          onClick={() =>
            go({
              route: '/journey',
              searchParams: { geo_debug: 'true', debugStop: 'colosseum' },
            })
          }
          style={chipStyle}
        >
          Arrive
        </button>
      </div>

      <p style={{ margin: '10px 0 0', opacity: 0.75 }}>
        Checklist: <code style={{ color: '#e8a13c' }}>docs/UX_REGRESSION_CHECKLIST.md</code>
      </p>
    </div>
  )
}
