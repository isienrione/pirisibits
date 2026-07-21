import Threshold from '../../components/Threshold.jsx'
import { T, F } from '../tokens.js'

/**
 * Redesign-facing adapter for the canonical Threshold component.
 * Maps presentation props to the shared waypoint shape — no duplicate hold logic.
 */
export default function C7Threshold({
  nowPhoto,
  thenPhoto,
  thenLoop = null,
  thenLabel = 'ANCIENT ROME',
  honestyCaption,
  waypointId = 'threshold',
  waypointName = 'Rome',
  nowAmbienceUrl = null,
  thenSoundscapeUrl = null,
  onCrossed,
  onHoldStart = null,
  onHoldEnd = null,
  hideUi = false,
  embedded = false,
  immersive = false,
  framed = false,
  reserveCtaSpace = false,
  active = true,
  autoPeek = false,
}) {
  const waypoint = {
    id: waypointId,
    name: waypointName,
    reconstruction: {
      now: nowPhoto,
      then: thenPhoto,
      loop: thenLoop,
      caption: honestyCaption ?? undefined,
    },
  }

  const surface = (
    <Threshold
      waypoint={waypoint}
      thenLabel={thenLabel}
      embedded={embedded || framed}
      immersive={immersive}
      active={active}
      nowAmbienceUrl={nowAmbienceUrl}
      thenSoundscapeUrl={thenSoundscapeUrl}
      onHoldStart={onHoldStart}
      onHoldEnd={onHoldEnd}
      hideUi={hideUi}
      autoPeek={autoPeek}
      onFullyRevealed={onCrossed}
    />
  )

  if (!embedded && !framed) return surface

  return (
    <div
      className={`cw-threshold-embedded${immersive ? ' cw-threshold-immersive' : ''}${reserveCtaSpace ? ' cw-threshold-embedded--reserve-cta' : ''}`}
      style={{ background: T.obsidian, fontFamily: F.body, height: framed ? '100%' : '100%' }}
    >
      {framed ? (
        <>
          <p className="cw-threshold-embedded__eyebrow">Immersion</p>
          <div className="cw-threshold-embedded__card">
            <div className="cw-threshold-embedded__handle" aria-hidden />
            <div className="cw-threshold-embedded__surface">{surface}</div>
          </div>
          <p className="cw-threshold-embedded__footer">Then · Now</p>
        </>
      ) : (
        <div className="cw-threshold-embedded__surface">{surface}</div>
      )}
    </div>
  )
}
