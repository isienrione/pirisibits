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
import { useT } from '../../i18n/I18nProvider.jsx'

export default function RedesignThresholdOverlay({
  waypoint,
  nowAmbienceUrl = null,
  thenSoundscapeUrl = null,
  onComplete,
}) {
  const [crossed, setCrossed] = useState(false)
  const t = useT()

  if (!waypoint) return null

  const reconstruction = waypoint.reconstruction
  const nowPhoto = reconstruction?.now ?? photoForWaypoint(waypoint)
  const thenPhoto = reconstruction?.then ?? thenPhotoForWaypoint(waypoint)
  const thenLoop = reconstruction?.loop ?? thenLoopForWaypoint(waypoint)

  return (
    <div
      className="cw-threshold-surface"
      data-testid="threshold-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        height: '100dvh',
        width: '100%',
        background: T.obsidian,
        overflow: 'hidden',
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <C7Threshold
        embedded
        reserveCtaSpace
        waypointId={waypoint.id}
        waypointName={titleForWaypoint(waypoint)}
        nowPhoto={nowPhoto}
        thenPhoto={thenPhoto}
        thenLoop={thenLoop}
        thenLabel={thenLabelForWaypoint(waypoint)}
        honestyCaption={honestyCaptionForWaypoint(waypoint)}
        nowAmbienceUrl={nowAmbienceUrl}
        thenSoundscapeUrl={thenSoundscapeUrl}
        onCrossed={() => setCrossed(true)}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 'max(14px, calc(env(safe-area-inset-bottom) + 8px))',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 80,
          width: 'min(420px, calc(100% - 32px))',
          display: 'grid',
          gap: 10,
        }}
      >
        {crossed && onComplete ? (
          <button
            type="button"
            data-testid="threshold-continue"
            onClick={onComplete}
            style={{
              width: '100%',
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
            {t('walk.continue')}
          </button>
        ) : onComplete ? (
          <button
            type="button"
            data-testid="threshold-skip"
            onClick={onComplete}
            style={{
              width: '100%',
              padding: '12px 20px',
              borderRadius: 14,
              border: `1px solid ${T.muted}44`,
              background: 'rgba(11,11,13,0.72)',
              color: T.warmWhite,
              fontWeight: 500,
              fontSize: 14,
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
            }}
          >
            {t('threshold.skipContinue')}
          </button>
        ) : null}
      </div>
    </div>
  )
}
