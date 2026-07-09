import { useState } from 'react'
import { T } from '../tokens.js'
import C7Threshold from '../screens/C7Threshold.jsx'
import {
  honestyCaptionForWaypoint,
  photoForWaypoint,
  thenLabelForWaypoint,
  thenLoopForWaypoint,
  thenPhotoForWaypoint,
  titleForWaypoint,
} from '../lib/waypointPresentation.js'

export default function RedesignThresholdOverlay({
  waypoint,
  nowAmbienceUrl = null,
  thenSoundscapeUrl = null,
  onComplete,
  onBackToStory,
}) {
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
        background: T.obsidian,
        overflow: 'hidden',
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <C7Threshold
        embedded
        reserveCtaSpace={crossed && Boolean(onComplete || onBackToStory)}
        waypointId={waypoint.id}
        waypointName={titleForWaypoint(waypoint)}
        nowPhoto={photoForWaypoint(waypoint)}
        thenPhoto={thenPhotoForWaypoint(waypoint)}
        thenLoop={thenLoopForWaypoint(waypoint)}
        thenLabel={thenLabelForWaypoint(waypoint)}
        honestyCaption={honestyCaptionForWaypoint(waypoint)}
        nowAmbienceUrl={nowAmbienceUrl}
        thenSoundscapeUrl={thenSoundscapeUrl}
        onCrossed={() => setCrossed(true)}
      />
      {crossed && onComplete ? (
        <button
          type="button"
          onClick={onComplete}
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
            background: T.ember,
            color: T.obsidian,
            fontWeight: 600,
            fontSize: 15,
            cursor: 'pointer',
            boxShadow: '0 4px 24px rgba(232,161,60,0.45)',
          }}
        >
          Continue walking →
        </button>
      ) : null}
      {crossed && onBackToStory ? (
        <button
          type="button"
          onClick={onBackToStory}
          style={{
            position: 'absolute',
            bottom: crossed && onComplete
              ? 'max(72px, calc(env(safe-area-inset-bottom) + 66px))'
              : 'max(14px, calc(env(safe-area-inset-bottom) + 8px))',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 80,
            background: 'none',
            border: 'none',
            color: `${T.bone}88`,
            fontSize: 13,
            cursor: 'pointer',
            padding: '8px 12px',
          }}
        >
          Back to story
        </button>
      ) : null}
    </div>
  )
}
