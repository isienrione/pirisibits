import { useJourney } from '../../hooks/useJourney'
import { JOURNEY_STATE_LIST } from '../../state/journeyState'
import { ROUTES } from '../../routes/paths'

/**
 * Dev-only journey state controls. Not rendered in production builds.
 */
export default function JourneyDevPanel() {
  const { state, context, currentStop, manifest, setState, updateContext, reset } = useJourney()
  const firstStop = manifest.stops[0]

  if (import.meta.env.PROD) return null

  return (
    <div
      data-testid="journey-dev-panel"
      style={{
        position: 'fixed',
        right: 8,
        bottom: 8,
        zIndex: 9999,
        maxWidth: 280,
        padding: 8,
        background: 'rgba(0,0,0,0.85)',
        color: '#f7f3ec',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 12,
        lineHeight: 1.4,
        borderRadius: 8,
      }}
    >
      <p style={{ margin: '0 0 6px', fontWeight: 700 }}>Journey dev</p>
      <p style={{ margin: '0 0 8px' }}>
        state: <strong>{state}</strong>
      </p>
      <p style={{ margin: '0 0 8px', wordBreak: 'break-word' }}>
        stop: {currentStop?.title ?? context.currentStopId ?? '-'} ({context.currentStopIndex})
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        {JOURNEY_STATE_LIST.map((nextState) => (
          <button
            key={nextState}
            type="button"
            aria-pressed={state === nextState}
            onClick={() => setState(nextState)}
            style={{
              minHeight: 32,
              minWidth: 32,
              padding: '4px 8px',
              border: state === nextState ? '1px solid #d4af37' : '1px solid #686e72',
              borderRadius: 4,
              background: state === nextState ? '#a8742a' : '#17212b',
              color: '#f7f3ec',
              cursor: 'pointer',
            }}
          >
            {nextState}
          </button>
        ))}
      </div>
      <p style={{ margin: '0 0 8px', opacity: 0.85 }}>
        <a href={ROUTES.home} style={{ color: '#e8a13c' }}>Home</a>
        {' · '}
        <a href={ROUTES.begin} style={{ color: '#e8a13c' }}>Begin</a>
        {' · '}
        <a href={ROUTES.journey} style={{ color: '#e8a13c' }}>Map</a>
        {' · '}
        <a href={ROUTES.journeySummary} style={{ color: '#e8a13c' }}>Letter</a>
        {' · '}
        <a href={ROUTES.journeyTimeline} style={{ color: '#e8a13c' }}>Timeline</a>
        {' · '}
        <a href={ROUTES.romePassport} style={{ color: '#e8a13c' }}>Passport</a>
        {' · '}
        <a href={ROUTES.exploreMore} style={{ color: '#e8a13c' }}>Explore</a>
        {' · '}
        <a href={ROUTES.journeyMemories} style={{ color: '#e8a13c' }}>Memories</a>
        {' · '}
        <a href={ROUTES.settings} style={{ color: '#e8a13c' }}>Settings</a>
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        <button
          type="button"
          onClick={() => {
            if (!firstStop) return
            updateContext({
              currentStopId: firstStop.id,
              currentStopIndex: firstStop.number - 1,
              hasAccess: true,
            })
          }}
          style={{ minHeight: 32, padding: '4px 8px', cursor: 'pointer' }}
        >
          Set stop
        </button>
        <button
          type="button"
          onClick={() => updateContext({ audioProgress: 0.5 })}
          style={{ minHeight: 32, padding: '4px 8px', cursor: 'pointer' }}
        >
          Audio 50%
        </button>
        <button
          type="button"
          onClick={reset}
          style={{ minHeight: 32, padding: '4px 8px', cursor: 'pointer' }}
        >
          Reset
        </button>
      </div>
    </div>
  )
}
