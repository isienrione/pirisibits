import { F, T } from '../tokens.js'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'

/** Prose era phrase for the first-time threshold invite headline. */
export function eraPhraseForInvite(thenLabel = 'ANCIENT ROME') {
  const era = thenLabel.trim()
  if (/^ancient rome$/i.test(era)) return 'the time of Ancient Rome'
  if (/^today$/i.test(era)) return 'the past'
  const lower = era.charAt(0) + era.slice(1).toLowerCase()
  return `the era of ${lower}`
}

function RevealDemo({ reducedMotion, accent, thenLabel }) {
  const thenShort = thenLabel.replace(/^the\s+/i, '').trim()
    .split(' ')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ')

  if (reducedMotion) {
    return (
      <div className="cw-reveal-invite__demo cw-reveal-invite__demo--static" aria-hidden>
        <div className="cw-reveal-invite__demo-then" />
        <div className="cw-reveal-invite__demo-now" />
        <div className="cw-reveal-invite__demo-seam" style={{ background: accent }} />
      </div>
    )
  }

  return (
    <div className="cw-reveal-invite__demo" aria-hidden>
      <div className="cw-reveal-invite__demo-then" />
      <div className="cw-reveal-invite__demo-now" />
      <div className="cw-reveal-invite__demo-seam" style={{ background: accent }} />
      <div className="cw-reveal-invite__demo-finger">
        <span className="cw-reveal-invite__demo-finger-core" />
      </div>
      <div className="cw-reveal-invite__demo-label cw-reveal-invite__demo-label--now">Today</div>
      <div className="cw-reveal-invite__demo-label cw-reveal-invite__demo-label--then">{thenShort}</div>
    </div>
  )
}

/**
 * Threshold invitation — animated press-and-hold demo + headline.
 * Auto mode: pointer-events none so holds pass through to the threshold beneath.
 * Interactive mode: prompted from the ? control — dismissible without holding.
 */
export default function ThresholdRevealInvite({
  thenLabel = 'ANCIENT ROME',
  accent = T.ember,
  interactive = false,
  onDismiss,
}) {
  const reducedMotion = useReducedMotion()
  const eraPhrase = eraPhraseForInvite(thenLabel)

  return (
    <div
      className={`cw-reveal-invite${interactive ? ' cw-reveal-invite--interactive' : ''}`}
      aria-live="polite"
    >
      <div className="cw-reveal-invite__card" data-testid="reveal-invite">
        {interactive && onDismiss ? (
          <button
            type="button"
            className="cw-reveal-invite__close"
            aria-label="Close"
            onClick={onDismiss}
          >
            ×
          </button>
        ) : null}
        <p className="cw-reveal-invite__eyebrow">Cross into the past</p>

        <RevealDemo reducedMotion={reducedMotion} accent={accent} thenLabel={thenLabel} />

        <h3 className="cw-reveal-invite__headline" style={{ fontFamily: F.display }}>
          Are you ready to see how this would have looked in {eraPhrase}?
        </h3>

        <p className="cw-reveal-invite__body" style={{ fontFamily: F.body }}>
          Hold anywhere on the image. History unlocks beneath your finger — narration keeps playing.
        </p>

        <p className="cw-reveal-invite__hint" style={{ fontFamily: F.body }}>
          <span className="cw-reveal-invite__hint-pulse" aria-hidden />
          Hold to unlock history
        </p>
      </div>
    </div>
  )
}
