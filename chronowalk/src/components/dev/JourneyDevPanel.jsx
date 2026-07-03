import { useJourney, useTourManifest } from '../../hooks/useJourney'
import { JOURNEY_STATES } from '../../state/journey'

const STATE_BUTTONS = Object.values(JOURNEY_STATES)

export default function JourneyDevPanel() {
  const { state, context, transition, reset, begin, states } = useJourney()
  const { manifest } = useTourManifest()

  if (!import.meta.env.DEV) return null

  const currentWaypoint =
    manifest?.waypoints?.[context.currentWaypointIndex]?.name ?? '—'

  return (
    <div
      style={{
        position: 'fixed',
        right: 8,
        bottom: 96,
        zIndex: 9999,
        width: 'min(92vw, 18rem)',
        padding: 12,
        borderRadius: 'var(--r-card)',
        background: 'color-mix(in srgb, var(--ink) 92%, transparent)',
        border: '1px solid color-mix(in srgb, var(--ember) 35%, transparent)',
        color: 'var(--warm-white)',
        fontSize: 'var(--fs-meta)',
        fontFamily: 'var(--font-ui)',
      }}
    >
      <p style={{ margin: 0, fontWeight: 600 }}>Journey dev panel</p>
      <p style={{ margin: '6px 0 0', opacity: 0.8 }}>
        State: <strong>{state}</strong>
      </p>
      <p style={{ margin: '4px 0 0', opacity: 0.8 }}>
        Stop: <strong>{currentWaypoint}</strong> (index {context.currentWaypointIndex})
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        {STATE_BUTTONS.map((nextState) => (
          <button
            key={nextState}
            type="button"
            onClick={() => transition(nextState)}
            style={{
              padding: '4px 8px',
              borderRadius: 999,
              border: '1px solid color-mix(in srgb, var(--warm-white) 25%, transparent)',
              background:
                state === nextState
                  ? 'color-mix(in srgb, var(--ember) 35%, transparent)'
                  : 'transparent',
              color: 'var(--warm-white)',
              fontSize: 11,
            }}
          >
            {nextState}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button type="button" onClick={() => begin({ dayNumber: 1 })}>
          Begin day 1
        </button>
        <button type="button" onClick={reset}>
          Reset
        </button>
      </div>
    </div>
  )
}
