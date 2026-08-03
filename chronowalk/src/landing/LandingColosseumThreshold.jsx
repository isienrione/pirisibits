import {
  LANDING_COLOSSEUM_NOW,
  LANDING_COLOSSEUM_THEN,
} from './landingVisualAssets.js'

/**
 * Colosseum then/now threshold visual - matched crops with dissolve reveal.
 * Clip-wipes exaggerate viewpoint mismatch; opacity dissolve keeps the beat readable.
 * Keeps legacy `cw-doc-threshold-demo*` classes for phone mockups.
 *
 * Defaults remain the exterior landing pair so archived sections stay unchanged.
 */
export default function LandingColosseumThreshold({
  reveal = 0,
  interactive = false,
  className = '',
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onPointerLeave,
  hint = 'Press and hold to reveal',
  showProgress = false,
  labelledBy,
  loading = 'lazy',
  fetchPriority,
  nowSrc = LANDING_COLOSSEUM_NOW,
  thenSrc = LANDING_COLOSSEUM_THEN,
  width = 960,
  height = 1280,
  ariaLabel = 'Colosseum today compared with an evidence-based ancient reconstruction',
}) {
  const amount = Math.min(1, Math.max(0, reveal))
  const progressPct = Math.round(amount * 100)
  const dissolving = amount > 0.02 && amount < 0.98

  return (
    <div
      className={`cw-doc-threshold-demo cw-threshold-stage${interactive ? ' cw-threshold-stage--interactive' : ' cw-doc-threshold-demo--static'}${className ? ` ${className}` : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onPointerLeave={onPointerLeave}
      role="img"
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : ariaLabel}
    >
      <div className="cw-doc-threshold-demo__then cw-threshold-stage__then" aria-hidden="true">
        <img
          className="cw-threshold-stage__img cw-threshold-stage__img--then"
          src={thenSrc}
          alt=""
          width={width}
          height={height}
          loading={loading}
          decoding="async"
          fetchPriority={fetchPriority}
          draggable={false}
        />
        {showProgress ? (
          <span className="cw-threshold-stage__tag cw-threshold-stage__tag--then">Past</span>
        ) : null}
      </div>

      <div
        className="cw-doc-threshold-demo__now cw-threshold-stage__now"
        style={{ opacity: 1 - amount }}
        aria-hidden="true"
      >
        <img
          className="cw-threshold-stage__img cw-threshold-stage__img--now"
          src={nowSrc}
          alt=""
          width={width}
          height={height}
          loading={loading}
          decoding="async"
          fetchPriority={fetchPriority}
          draggable={false}
        />
        {showProgress ? (
          <span className="cw-threshold-stage__tag cw-threshold-stage__tag--now">Today</span>
        ) : null}
      </div>

      <div
        className={`cw-doc-threshold-demo__seam cw-threshold-stage__seam cw-threshold-stage__seam--dissolve${dissolving ? ' cw-doc-threshold-demo__seam--active is-active' : ''}`}
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

      {hint && amount < 0.15 ? (
        <p className="cw-doc-threshold-demo__hint cw-threshold-stage__hint">{hint}</p>
      ) : null}
    </div>
  )
}
