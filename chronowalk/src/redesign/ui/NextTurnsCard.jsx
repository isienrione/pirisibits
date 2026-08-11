import { formatStepDistance } from '../../components/DirectionsStepList.jsx'
import { useT } from '../../i18n/I18nProvider.jsx'

/**
 * Format a Directions step for the Next turns card.
 * Example: "Exit the Colosseum and turn left - 120 m"
 */
export function formatNextTurnLine(step, fallback = 'Continue') {
  const instruction = String(step?.instruction ?? '').trim() || fallback
  const distance =
    typeof step?.distanceM === 'number' && step.distanceM > 0
      ? formatStepDistance(step.distanceM)
      : null
  return distance ? `${instruction} - ${distance}` : instruction
}

/**
 * "Next turns" card on the Walking-to screen.
 * Fed by Mapbox Directions `legs[].steps[]` (normalized to `{ instruction, distanceM }`).
 * Vertical timeline (node + connector) + destination thumbnail.
 */
export default function NextTurnsCard({
  steps = [],
  currentStepIndex = 0,
  loading = false,
  error = null,
  destinationTitle = 'Destination',
  destinationPhoto = null,
  onRetry,
  externalMapsUrl = null,
  onOpenExternalMaps,
  maxVisible = 4,
}) {
  const t = useT()
  const start = Math.max(0, currentStepIndex)
  const visible =
    typeof maxVisible === 'number' ? steps.slice(start, start + maxVisible) : steps.slice(start)

  const openMaps = () => {
    if (!externalMapsUrl) return
    if (onOpenExternalMaps) onOpenExternalMaps(externalMapsUrl)
    else window.open(externalMapsUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <section
      className="cw-next-turns-card"
      data-testid="next-turns-card"
      aria-label={t('walk.directions.nextTurnsAria', { title: destinationTitle })}
    >
      <header className="cw-next-turns-card__head">
        <div className="cw-next-turns-card__head-copy">
          <p className="cw-next-turns-card__eyebrow">{t('walk.directions.nextTurns')}</p>
          <p className="cw-next-turns-card__destination">{destinationTitle}</p>
        </div>
        {destinationPhoto ? (
          <img
            className="cw-next-turns-card__thumb"
            src={destinationPhoto}
            alt=""
            width={48}
            height={48}
            decoding="async"
          />
        ) : (
          <span className="cw-next-turns-card__thumb cw-next-turns-card__thumb--placeholder" aria-hidden />
        )}
      </header>

      {loading ? (
        <p className="cw-next-turns-card__status" data-testid="next-turns-status">
          {t('walk.directions.finding')}
        </p>
      ) : error ? (
        <div className="cw-next-turns-card__status-block">
          <p
            className={`cw-next-turns-card__status${!onRetry && !externalMapsUrl ? '' : ' cw-next-turns-card__status--error'}`}
          >
            {error}
          </p>
          <div className="cw-next-turns-card__actions">
            {onRetry ? (
              <button type="button" className="cw-next-turns-card__action cw-wc-pressable" onClick={onRetry}>
                {t('action.retry')}
              </button>
            ) : null}
            {externalMapsUrl ? (
              <button
                type="button"
                className="cw-next-turns-card__action cw-next-turns-card__action--maps cw-wc-pressable"
                onClick={openMaps}
              >
                {t('walk.directions.openGoogle')}
              </button>
            ) : null}
          </div>
        </div>
      ) : !visible.length ? (
        <p className="cw-next-turns-card__status" data-testid="next-turns-status">
          {t('walk.directions.waiting')}
        </p>
      ) : (
        <ol
          className="cw-next-turns-card__timeline"
          aria-label={t('walk.directions.upcomingAria', { title: destinationTitle })}
        >
          {visible.map((step, offset) => {
            const index = start + offset
            const isCurrent = index === currentStepIndex
            const isLast = offset === visible.length - 1
            return (
              <li
                key={`${step.instruction}-${index}`}
                className={`cw-next-turns-card__item${isCurrent ? ' cw-next-turns-card__item--current' : ''}${
                  isLast ? ' cw-next-turns-card__item--last' : ''
                }`}
              >
                <span className="cw-next-turns-card__rail" aria-hidden>
                  <span className="cw-next-turns-card__node" />
                  {!isLast ? <span className="cw-next-turns-card__connector" /> : null}
                </span>
                <p className="cw-next-turns-card__line">
                  {formatNextTurnLine(step, t('walk.directions.continue'))}
                </p>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
