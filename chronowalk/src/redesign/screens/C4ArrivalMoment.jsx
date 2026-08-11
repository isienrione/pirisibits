import { T, F } from '../tokens.js'
import { colosseumNow } from '../images.js'
import { Vignette, Eyebrow, PulseRings } from '../ui/index.js'
import { useT } from '../../i18n/I18nProvider.jsx'

/**
 * Arrival - photo fills leftover space; cream card hugs copy + CTAs so there
 * is no empty bone under “Read instead”. Tab-bar inset lives on the phone
 * frame, not as a second home-indicator pad here.
 */
export default function C4ArrivalMoment({
  accent = T.actI,
  title = 'The Colosseum',
  photo = colosseumNow,
  description = null,
  unlockNotice = false,
  onBeginListening,
  onTranscript,
  onViewImages,
  busy = false,
}) {
  const t = useT()
  const resolvedDescription = description ?? t('arrival.fallback')

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
        {unlockNotice ? (
          <div
            className="cw-arrival-moment__unlock"
            data-testid="arrival-unlock-notice"
            role="status"
            aria-live="polite"
          >
            <span className="cw-arrival-moment__unlock-dot" style={{ background: accent }} />
            <p style={{ fontFamily: F.body }}>{t('arrival.unlocked')}</p>
          </div>
        ) : null}
      </div>

      <div className="cw-arrival-moment__card">
        <div className="cw-arrival-moment__copy">
          <Eyebrow color={accent}>{t('arrival.eyebrow')}</Eyebrow>
          <h1
            className="cw-arrival-moment__title"
            style={{ fontFamily: F.display, color: T.ink }}
          >
            {title}
          </h1>
          <p className="cw-arrival-moment__desc" style={{ color: T.muted }}>
            {resolvedDescription}
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
            {t('arrival.listen')}
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
              {t('arrival.read')}
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
              {t('arrival.images')}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
