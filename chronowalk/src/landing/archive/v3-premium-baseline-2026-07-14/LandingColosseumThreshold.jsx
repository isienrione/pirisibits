import { LANDING_COLOSSEUM_NOW, LANDING_COLOSSEUM_THEN } from './landingVisualAssets.js'

/** Center-slice clip — NOW band shrinks toward the middle as reveal increases. */
export function landingThresholdClip(reveal) {
  const inset = Math.min(1, Math.max(0, reveal)) * 50
  return `inset(0 ${inset}% 0 ${inset}%)`
}

/**
 * Colosseum then/now threshold visual — same assets everywhere on the landing page.
 * @param {{ reveal?: number, interactive?: boolean, className?: string, onPointerDown?: function, onPointerUp?: function, onPointerCancel?: function, onPointerLeave?: function, hint?: string }} props
 */
export default function LandingColosseumThreshold({
  reveal = 0,
  interactive = false,
  className = '',
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  onPointerLeave,
  hint = 'Press and hold to cross',
}) {
  const clip = landingThresholdClip(reveal)
  const seamVisible = reveal > 0

  return (
    <div
      className={`cw-doc-threshold-demo${interactive ? '' : ' cw-doc-threshold-demo--static'}${className ? ` ${className}` : ''}`}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onPointerLeave={onPointerLeave}
      role="img"
      aria-label="Colosseum today compared with an evidence-based ancient reconstruction"
    >
      <div className="cw-doc-threshold-demo__then">
        <img src={LANDING_COLOSSEUM_THEN} alt="" loading="lazy" />
      </div>

      <div
        className="cw-doc-threshold-demo__now"
        style={{ clipPath: clip, WebkitClipPath: clip }}
      >
        <img src={LANDING_COLOSSEUM_NOW} alt="" loading="lazy" />
      </div>

      <div
        className={`cw-doc-threshold-demo__seam${seamVisible ? ' cw-doc-threshold-demo__seam--active' : ''}`}
        aria-hidden
      />

      {hint ? <p className="cw-doc-threshold-demo__hint">{hint}</p> : null}
    </div>
  )
}
