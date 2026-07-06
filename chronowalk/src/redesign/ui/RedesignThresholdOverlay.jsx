import C7Threshold from '../screens/C7Threshold.jsx'
import { photoForWaypoint, thenPhotoForWaypoint } from '../lib/waypointPresentation.js'

export default function RedesignThresholdOverlay({ waypoint, onDismiss }) {
  if (!waypoint) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, background: '#16130F' }}>
      <C7Threshold
        nowPhoto={photoForWaypoint(waypoint)}
        thenPhoto={thenPhotoForWaypoint(waypoint)}
        honestyCaption={waypoint.reconstruction?.honesty ?? waypoint.honestyCaption}
        onDismiss={onDismiss}
      />
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          style={{
            position: 'absolute',
            bottom: 'max(24px, env(safe-area-inset-bottom))',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 80,
            padding: '14px 24px',
            borderRadius: 12,
            border: 'none',
            background: '#E8A13C',
            color: '#16130F',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Continue walking
        </button>
      ) : null}
    </div>
  )
}
