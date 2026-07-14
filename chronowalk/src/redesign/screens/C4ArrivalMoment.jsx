import { useEffect, useRef } from 'react'
import { T } from '../tokens.js'
import { colosseumNow } from '../images.js'
import { GoldSeam, PrimaryButton } from '../ui/index.js'
import {
  AtmosphereDim,
  FadeReveal,
  SubtleDrift,
  useCeremonyTimeline,
  ARRIVAL_CEREMONY,
  ARRIVAL_CEREMONY_REDUCED,
  ARRIVAL_DURATIONS,
} from '../motion/index.js'

/**
 * Ceremonial arrival — museum / keynote cadence.
 * Pause → dim → ambient → drift → Gold Seam → title → delayed CTA.
 */
export default function C4ArrivalMoment({
  accent = T.actI,
  title = 'The Colosseum',
  photo = colosseumNow,
  description = 'Take a second. Look up.',
  onBeginListening,
  onTranscript,
  onViewImages,
  onAtmosphereStart,
  busy = false,
}) {
  const { beats, reducedMotion } = useCeremonyTimeline(ARRIVAL_CEREMONY, {
    enabled: true,
    reducedTimeline: ARRIVAL_CEREMONY_REDUCED,
  })
  const atmosphereStarted = useRef(false)

  useEffect(() => {
    if (!beats.ambient || atmosphereStarted.current) return
    atmosphereStarted.current = true
    onAtmosphereStart?.()
  }, [beats.ambient, onAtmosphereStart])

  const dimIntensity = beats.dim ? 1 : 0.15

  return (
    <div
      className="cw-arrival-ceremony"
      data-testid="arrival-ceremony"
      role="status"
      aria-live="polite"
      style={{ '--cw-arrival-accent': accent }}
    >
      <div className="cw-arrival-ceremony__stage">
        <SubtleDrift
          active={beats.drift && !reducedMotion}
          duration={ARRIVAL_DURATIONS.driftMs}
        >
          {photo ? (
            <img className="cw-arrival-ceremony__photo" src={photo} alt="" />
          ) : (
            <div className="cw-arrival-ceremony__photo" style={{ background: T.charcoal }} />
          )}
        </SubtleDrift>
        <AtmosphereDim intensity={dimIntensity} maxOpacity={0.55} />
        <div className="cw-arrival-ceremony__vignette" aria-hidden />
      </div>

      <div className="cw-arrival-ceremony__content">
        <FadeReveal show={beats.seam} duration={900} y={0}>
          <p className="cw-arrival-ceremony__eyebrow">You have arrived</p>
        </FadeReveal>

        <FadeReveal show={beats.seam} duration={1000} y={0} className="cw-arrival-ceremony__seam">
          <GoldSeam moment="arrival" play={beats.seam} />
        </FadeReveal>

        <FadeReveal show={beats.title} duration={ARRIVAL_DURATIONS.titleMs} y={14}>
          <h1 className="cw-arrival-ceremony__title">{title}</h1>
        </FadeReveal>

        <FadeReveal show={beats.copy} duration={ARRIVAL_DURATIONS.copyMs} y={8}>
          <p className="cw-arrival-ceremony__copy">{description}</p>
        </FadeReveal>

        <div className="cw-arrival-ceremony__actions">
          {beats.cta ? (
            <FadeReveal show duration={ARRIVAL_DURATIONS.ctaMs} y={8}>
              <PrimaryButton
                color={accent}
                textColor={T.warmWhite}
                glow={false}
                disabled={busy}
                onClick={onBeginListening}
                data-testid="arrival-begin-listening"
              >
                Begin listening
              </PrimaryButton>
            </FadeReveal>
          ) : null}

          {beats.secondary ? (
            <FadeReveal show duration={ARRIVAL_DURATIONS.secondaryMs} y={6}>
              <div className="cw-arrival-ceremony__secondary">
                {onTranscript ? (
                  <button
                    type="button"
                    className="cw-arrival-ceremony__ghost"
                    disabled={busy}
                    onClick={onTranscript}
                  >
                    Read instead
                  </button>
                ) : null}
                {onViewImages ? (
                  <button
                    type="button"
                    className="cw-arrival-ceremony__ghost"
                    disabled={busy}
                    onClick={onViewImages}
                  >
                    View images only
                  </button>
                ) : null}
              </div>
            </FadeReveal>
          ) : null}
        </div>
      </div>
    </div>
  )
}
