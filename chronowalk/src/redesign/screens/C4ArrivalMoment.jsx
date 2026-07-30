import { T, F } from '../tokens.js'
import { colosseumNow } from '../images.js'
import { Vignette, Eyebrow, PulseRings } from '../ui/index.js'

/**
 * Arrival — full-bleed photo + cream card with full immersive options on every stop.
 * CTAs pin to the card floor; tab-bar safe-area is owned by the shell inset, not
 * a second home-indicator pad inside this card.
 */
export default function C4ArrivalMoment({
  accent = T.actI,
  title = 'The Colosseum',
  photo = colosseumNow,
  description = 'Take a second. Look up.',
  onBeginListening,
  onTranscript,
  onViewImages,
  busy = false,
}) {
  return (
    <div className="cw-arrival-moment" data-testid="arrival-moment">
      <div className="cw-arrival-moment__photo">
        <div
          className="cw-arrival-moment__photo-img"
          style={{ backgroundImage: `url(${photo})` }}
        />
        <Vignette />
        <div className="cw-arrival-moment__photo-scrim" />
        <div className="cw-arrival-moment__pulse">
          <PulseRings accent={accent} variant="arrival" count={3} />
        </div>
      </div>

      <div className="cw-arrival-moment__card">
        <div className="cw-arrival-moment__copy">
          <Eyebrow color={accent}>YOU&apos;VE ARRIVED</Eyebrow>
          <h1
            className="cw-arrival-moment__title"
            style={{ fontFamily: F.display, color: T.ink }}
          >
            {title}
          </h1>
          <p className="cw-arrival-moment__desc" style={{ color: T.muted }}>
            {description}
          </p>
        </div>

        <div className="cw-arrival-moment__actions">
          <button
            type="button"
            disabled={busy}
            onClick={onBeginListening}
            className="cw-arrival-moment__primary"
            style={{
              background: accent,
              color: T.warmWhite,
              fontFamily: F.body,
              boxShadow: `0 4px 20px ${accent}44`,
            }}
          >
            Begin listening
          </button>

          {onTranscript ? (
            <button
              type="button"
              disabled={busy}
              onClick={onTranscript}
              className="cw-arrival-moment__secondary"
              style={{
                borderColor: `${T.muted}55`,
                color: T.ink,
                fontFamily: F.body,
              }}
            >
              Read instead
            </button>
          ) : null}

          {onViewImages ? (
            <button
              type="button"
              disabled={busy}
              onClick={onViewImages}
              className="cw-arrival-moment__tertiary"
              style={{
                borderColor: `${accent}55`,
                color: accent,
                fontFamily: F.body,
              }}
            >
              View images only
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
