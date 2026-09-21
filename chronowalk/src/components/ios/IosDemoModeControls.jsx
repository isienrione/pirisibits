import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, MapPinned } from 'lucide-react'
import { useSharedWalkGuard } from '../../redesign/context/SharedWalkGuardContext.jsx'
import { useV2Journey, useTourManifest } from '../../hooks/useV2Journey.js'
import { JOURNEY_STATES } from '../../state/journey.js'
import {
  enableIosDemoMode,
  getIosDemoStopIds,
  getIosDemoStopIndex,
  isIosDemoMode,
  shouldOfferIosDemoPreview,
  subscribeIosDemoMode,
} from '../../lib/iosDemoMode.js'
import { IS_IOS } from '../../lib/platform.js'

/**
 * Clearly visible App Store reviewer CTA — enters simulated-location walkthrough.
 */
export function IosDemoPreviewButton({
  locationDenied = false,
  distanceFromRouteM = null,
  style = {},
}) {
  const navigate = useNavigate()
  const { requestJumpToWaypoint } = useSharedWalkGuard()
  const { state, context, begin } = useV2Journey()
  const { manifest } = useTourManifest()
  const [active, setActive] = useState(() => isIosDemoMode())
  const [busy, setBusy] = useState(false)

  useEffect(() => subscribeIosDemoMode(setActive), [])

  const visible =
    IS_IOS &&
    shouldOfferIosDemoPreview({ locationDenied, distanceFromRouteM })

  const startDemo = useCallback(async () => {
    if (!manifest || busy) return
    setBusy(true)
    enableIosDemoMode()
    const stopIds = getIosDemoStopIds(manifest, context)
    const firstId = stopIds[0]
    if (firstId) {
      if (state === JOURNEY_STATES.IDLE || state === JOURNEY_STATES.COMPLETE) {
        begin({
          pace: context.pace,
          path: context.path,
          sequenceIndex: 0,
          customWaypointIds: context.customWaypointIds,
        })
      }
      await requestJumpToWaypoint(manifest, firstId, context, state, {
        targetState: JOURNEY_STATES.STORY,
        storyView: 'chapters',
      })
    }
    setBusy(false)
    navigate('/journey')
  }, [begin, busy, context, manifest, navigate, requestJumpToWaypoint, state])

  if (!visible) return null

  return (
    <button
      type="button"
      data-testid="ios-demo-preview-button"
      onClick={() => void startDemo()}
      disabled={busy}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        width: '100%',
        minHeight: 52,
        padding: '14px 18px',
        borderRadius: 14,
        border: '2px solid #C4A35A',
        background: active
          ? 'linear-gradient(180deg, #C4A35A 0%, #A8883E 100%)'
          : 'linear-gradient(180deg, #1A1612 0%, #2A241C 100%)',
        color: active ? '#1A1612' : '#F5F0E8',
        fontWeight: 700,
        fontSize: 15,
        letterSpacing: '0.01em',
        cursor: busy ? 'wait' : 'pointer',
        boxShadow: '0 6px 18px rgba(26, 22, 18, 0.18)',
        ...style,
      }}
    >
      <MapPinned size={18} aria-hidden />
      {active ? 'Demo mode active — continue walk' : 'Preview the walk from anywhere'}
    </button>
  )
}

/**
 * Next / Previous stop steppers shown while iOS demo mode is active.
 */
export function IosDemoStepControls({ currentWaypointId = null }) {
  const navigate = useNavigate()
  const { requestJumpToWaypoint } = useSharedWalkGuard()
  const { state, context } = useV2Journey()
  const { manifest } = useTourManifest()
  const [active, setActive] = useState(() => isIosDemoMode())
  const [busy, setBusy] = useState(false)

  useEffect(() => subscribeIosDemoMode(setActive), [])

  const stopIds = useMemo(
    () => (manifest ? getIosDemoStopIds(manifest, context) : []),
    [manifest, context],
  )
  const index = getIosDemoStopIndex(manifest, context, currentWaypointId)
  const at = index >= 0 ? index : 0

  const jump = useCallback(
    async (waypointId) => {
      if (!manifest || !waypointId || busy) return
      setBusy(true)
      await requestJumpToWaypoint(manifest, waypointId, context, state, {
        targetState: JOURNEY_STATES.STORY,
        storyView: 'chapters',
      })
      setBusy(false)
      navigate('/journey')
    },
    [busy, context, manifest, navigate, requestJumpToWaypoint, state],
  )

  if (!IS_IOS || !active || stopIds.length === 0) return null

  const prevId = at > 0 ? stopIds[at - 1] : null
  const nextId = at < stopIds.length - 1 ? stopIds[at + 1] : null

  return (
    <div
      data-testid="ios-demo-step-controls"
      style={{
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 12px',
        borderRadius: 14,
        background: 'rgba(26, 22, 18, 0.92)',
        color: '#F5F0E8',
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      <button
        type="button"
        data-testid="ios-demo-prev"
        disabled={!prevId || busy}
        onClick={() => prevId && void jump(prevId)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '10px 14px',
          borderRadius: 10,
          border: '1px solid rgba(245, 240, 232, 0.25)',
          background: prevId ? '#C4A35A' : 'transparent',
          color: prevId ? '#1A1612' : 'rgba(245, 240, 232, 0.4)',
          fontWeight: 700,
          cursor: prevId ? 'pointer' : 'default',
        }}
      >
        <ChevronLeft size={16} aria-hidden />
        Previous
      </button>
      <span aria-live="polite">
        Stop {Math.min(at + 1, stopIds.length)} / {stopIds.length}
      </span>
      <button
        type="button"
        data-testid="ios-demo-next"
        disabled={!nextId || busy}
        onClick={() => nextId && void jump(nextId)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '10px 14px',
          borderRadius: 10,
          border: '1px solid rgba(245, 240, 232, 0.25)',
          background: nextId ? '#C4A35A' : 'transparent',
          color: nextId ? '#1A1612' : 'rgba(245, 240, 232, 0.4)',
          fontWeight: 700,
          cursor: nextId ? 'pointer' : 'default',
        }}
      >
        Next
        <ChevronRight size={16} aria-hidden />
      </button>
    </div>
  )
}
