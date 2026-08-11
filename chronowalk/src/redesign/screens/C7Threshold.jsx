import Threshold from '../../components/Threshold.jsx'
import { T, F } from '../tokens.js'
import { useT } from '../../i18n/I18nProvider.jsx'

/**
 * Redesign-facing adapter for the canonical Threshold component.
 * Maps presentation props to the shared waypoint shape - no duplicate hold logic.
 */
export default function C7Threshold({
  nowPhoto,
  thenPhoto,
  thenLoop = null,
  thenLabel = null,
  honestyCaption,
  waypointId = 'threshold',
  waypointName = 'Rome',
  nowAmbienceUrl = null,
  thenSoundscapeUrl = null,
  onCrossed,
  onHoldStart = null,
  onHoldEnd = null,
  onNowTap = null,
  hideUi = false,
  embedded = false,
  immersive = false,
  framed = false,
  reserveCtaSpace = false,
  active = true,
  autoPeek = false,
  demoAutoReveal = false,
}) {
  const t = useT()
  const resolvedThenLabel = thenLabel ?? t('threshold.ancientRome')
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
      thenLabel={resolvedThenLabel}
      embedded={embedded || framed}
      immersive={immersive}
      active={active}
      nowAmbienceUrl={nowAmbienceUrl}
      thenSoundscapeUrl={thenSoundscapeUrl}
      onHoldStart={onHoldStart}
      onHoldEnd={onHoldEnd}
      onNowTap={onNowTap}
      hideUi={hideUi}
      autoPeek={autoPeek}
      demoAutoReveal={demoAutoReveal}
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
          <p className="cw-threshold-embedded__eyebrow">{t('threshold.immersion')}</p>
          <div className="cw-threshold-embedded__card">
            <div className="cw-threshold-embedded__handle" aria-hidden />
            <div className="cw-threshold-embedded__surface">{surface}</div>
          </div>
          <p className="cw-threshold-embedded__footer">{t('threshold.thenNow')}</p>
        </>
      ) : (
        <div className="cw-threshold-embedded__surface">{surface}</div>
      )}
    </div>
  )
}
