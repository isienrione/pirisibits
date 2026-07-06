import { useMemo } from 'react'
import { isDebugGeo, getDebugGeoPlacement } from '../../config/env.js'
import { setDevSimulateGps } from '../dev/devTools.js'
import { useTourManifest } from '../../hooks/useV2Journey.js'
import { useV2Journey } from '../../hooks/useV2Journey.js'
import { useJourneyStep } from '../../hooks/useJourneyStep.js'
import { isDevPanelEnabled } from '../../config/env.js'
import { resolveDebugWaypointId, findSequenceIndexForWaypoint } from '../../lib/debugWaypoint.js'

const STAGING_WAYPOINTS = [
  { label: 'Colosseum', id: 'colosseum' },
  { label: 'Capitoline', id: 'capitoline-hill' },
  { label: 'Pantheon', id: 'pantheon' },
  { label: 'Navona', id: 'piazza-navona' },
]

function buildDebugUrl({ geo = true, stop, placement = 'arrived', reset = false, devPanel = true }) {
  const params = new URLSearchParams()
  if (geo) params.set('geo_debug', placement === 'arrived' ? 'true' : placement)
  if (stop) params.set('debugStop', stop)
  if (reset) params.set('resetTour', 'true')
  if (devPanel) params.set('devPanel', 'true')
  return `?${params.toString()}`
}

/** Field-test panel for v2 redesign — works on chronowalk2 via ?devPanel=true */
export default function V2FieldTestPanel() {
  const { manifest } = useTourManifest()
  const { state, context, jumpToSequence, begin } = useV2Journey()
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

  if (!isDevPanelEnabled() && !isDebugGeo()) return null

  const jumpToStop = (slug) => {
    if (!manifest) return
    const waypointId = resolveDebugWaypointId(slug, manifest)
    const path = context.path || 'a'
    const index = findSequenceIndexForWaypoint(manifest, waypointId, path, context.promotedOptionalIds)
    if (index < 0) return
    begin({ pace: context.pace || 'classic', path, waypointIndex: 0 })
    jumpToSequence(index)
  }

  return (
    <div
      data-testid="v2-field-test-panel"
      style={{
        position: 'fixed',
        left: 8,
        bottom: 'calc(var(--shell-tab-bar-height, 72px) + 8px)',
        zIndex: 9999,
        maxWidth: 300,
        padding: 10,
        background: 'rgba(0,0,0,0.88)',
        color: '#f5efe3',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 11,
        lineHeight: 1.45,
        borderRadius: 10,
        border: '1px solid rgba(232,161,60,0.35)',
      }}
    >
      <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#e8a13c' }}>Field test</p>
      <p style={{ margin: '0 0 8px' }}>
        GPS: {isDebugGeo() ? `simulated (${getDebugGeoPlacement()})` : 'live'}
        <br />
        Stop: {activeLabel}
        <br />
        State: {state}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        {STAGING_WAYPOINTS.map((stop) => (
          <button
            key={stop.id}
            type="button"
            onClick={() => jumpToStop(stop.id)}
            style={chipStyle}
          >
            {stop.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        <button type="button" onClick={() => setDevSimulateGps(true)} style={chipStyle}>
          At stop
        </button>
        <button type="button" onClick={() => setDevSimulateGps(false)} style={chipStyle}>
          Live GPS
        </button>
        <a
          href={buildDebugUrl({ stop: 'colosseum', placement: 'walking', reset: true })}
          style={{ ...chipStyle, textDecoration: 'none', display: 'inline-block' }}
        >
          Walk mode
        </a>
        <a
          href={buildDebugUrl({ stop: 'colosseum', reset: true })}
          style={{ ...chipStyle, textDecoration: 'none', display: 'inline-block' }}
        >
          Arrive Colosseum
        </a>
      </div>
    </div>
  )
}

const chipStyle = {
  minHeight: 28,
  padding: '4px 8px',
  border: '1px solid #686e72',
  borderRadius: 6,
  background: '#17212b',
  color: '#f5efe3',
  cursor: 'pointer',
  fontSize: 11,
}
