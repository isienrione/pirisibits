import { LANDING_COLOSSEUM_NOW, LANDING_COLOSSEUM_THEN } from './landingVisualAssets.js'
import { landingThresholdClip } from './landingThresholdClip.js'

/**
 * Colosseum then/now threshold visual — shared NOW/THEN assets.
 * Keeps legacy `cw-doc-threshold-demo*` classes for phone mockups.
 */
export default function LandingColosseumThreshold({
  reveal = 0,
  interactive = false,
  className = '',
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  onPointerLeave,
  hint = 'Press and hold to reveal',
  showProgress = false,
  labelledBy,
}) {
  const clip = landingThresholdClip(reveal)
  const insetPct = Math.min(1, Math.max(0, reveal)) * 50
  const seamVisible = reveal > 0.02 && reveal < 0.98
  const progressPct = Math.round(Math.min(1, Math.max(0, reveal)) * 100)

  return (
    <div
      className={`cw-doc-threshold-demo cw-threshold-stage${interactive ? ' cw-threshold-stage--interactive' : ' cw-doc-threshold-demo--static'}${className ? ` ${className}` : ''}`}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onPointerLeave={onPointerLeave}
      role="img"
      aria-labelledby={labelledBy}
      aria-label={
        labelledBy
          ? undefined
          : 'Colosseum today compared with an evidence-based ancient reconstruction'
      }
    >
      <div className="cw-doc-threshold-demo__then cw-threshold-stage__then" aria-hidden="true">
        <img
          className="cw-threshold-stage__img cw-threshold-stage__img--then"
          src={LANDING_COLOSSEUM_THEN}
          alt=""
          width={1280}
          height={720}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
        {showProgress ? (
          <span className="cw-threshold-stage__tag cw-threshold-stage__tag--then">Past</span>
        ) : null}
      </div>

      <div
        className="cw-doc-threshold-demo__now cw-threshold-stage__now"
        style={{ clipPath: clip, WebkitClipPath: clip }}
        aria-hidden="true"
      >
        <img
          className="cw-threshold-stage__img cw-threshold-stage__img--now"
          src={LANDING_COLOSSEUM_NOW}
          alt=""
          width={941}
          height={1672}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
        {showProgress ? (
          <span className="cw-threshold-stage__tag cw-threshold-stage__tag--now">Today</span>
        ) : null}
      </div>

      <div
        className={`cw-doc-threshold-demo__seam cw-threshold-stage__seam cw-threshold-stage__seam--left${seamVisible ? ' cw-doc-threshold-demo__seam--active is-active' : ''}`}
        style={{ left: `${insetPct}%` }}
        aria-hidden="true"
      />
      <div
        className={`cw-threshold-stage__seam cw-threshold-stage__seam--right${seamVisible ? ' is-active' : ''}`}
        style={{ right: `${insetPct}%` }}
        aria-hidden="true"
      />

      {showProgress ? (
        <div
          className="cw-threshold-stage__progress"
          aria-hidden="true"
          style={{ '--threshold-progress': `${progressPct}%` }}
        >
          <span className="cw-threshold-stage__progress-fill" />
        </div>
      ) : null}

      {hint && reveal < 0.15 ? (
        <p className="cw-doc-threshold-demo__hint cw-threshold-stage__hint">{hint}</p>
      ) : null}
    </div>
  )
}
