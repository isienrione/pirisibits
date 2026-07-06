import { useState } from 'react'
import C7Threshold from '../screens/C7Threshold.jsx'
import { photoForWaypoint, thenPhotoForWaypoint } from '../lib/waypointPresentation.js'

export default function RedesignThresholdOverlay({ waypoint, onDismiss }) {
  const [crossed, setCrossed] = useState(false)

  if (!waypoint) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, background: '#16130F' }}>
      <C7Threshold
        nowPhoto={photoForWaypoint(waypoint)}
        thenPhoto={thenPhotoForWaypoint(waypoint)}
        honestyCaption={waypoint.reconstruction?.honesty ?? waypoint.honestyCaption}
        onCrossed={() => setCrossed(true)}
      />
      {crossed && onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          style={{
            position: 'absolute',
            bottom: 'max(28px, env(safe-area-inset-bottom))',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 80,
            padding: '15px 28px',
            borderRadius: 14,
            border: 'none',
            background: '#E8A13C',
            color: '#16130F',
            fontWeight: 600,
            fontSize: 15,
            cursor: 'pointer',
            boxShadow: '0 4px 24px rgba(232,161,60,0.45)',
          }}
        >
          Continue to story
        </button>
      ) : null}
    </div>
  )
}
