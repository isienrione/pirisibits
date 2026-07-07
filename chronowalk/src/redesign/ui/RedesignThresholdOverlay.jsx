import { useState } from 'react'
import C7Threshold from '../screens/C7Threshold.jsx'
import {
  honestyCaptionForWaypoint,
  photoForWaypoint,
  thenLabelForWaypoint,
  thenPhotoForWaypoint,
} from '../lib/waypointPresentation.js'

export default function RedesignThresholdOverlay({ waypoint, onDismiss }) {
  const [crossed, setCrossed] = useState(false)

  if (!waypoint) return null

  return (
    <div
      className="cw-threshold-surface"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
        height: '100dvh',
        width: '100%',
        background: '#16130F',
        overflow: 'hidden',
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <C7Threshold
        embedded
        reserveCtaSpace={crossed && Boolean(onDismiss)}
        nowPhoto={photoForWaypoint(waypoint)}
        thenPhoto={thenPhotoForWaypoint(waypoint)}
        thenLabel={thenLabelForWaypoint(waypoint)}
        honestyCaption={honestyCaptionForWaypoint(waypoint)}
        onCrossed={() => setCrossed(true)}
      />
      {crossed && onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          style={{
            position: 'absolute',
            bottom: 'max(14px, calc(env(safe-area-inset-bottom) + 8px))',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 80,
            width: 'min(420px, calc(100% - 32px))',
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
