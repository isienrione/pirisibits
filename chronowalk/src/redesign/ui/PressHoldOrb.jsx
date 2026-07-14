import { HOLD_COPY, HOLD_VISUAL } from '../../interaction/pressHoldSpec.js'

const SIZE = 88
const STROKE = 1.75
const R = (SIZE - STROKE * 2) / 2 - 4
const C = 2 * Math.PI * R

/**
 * Signature Press & Hold orb — pressure, progress, glow, blur, depth.
 * Pure presentational; parent drives `progress` (0–1) and phase.
 *
 * Phases: idle | pressing | charging | releasing | unlocked
 */
export function PressHoldOrb({
  progress = 0,
  phase = 'idle',
  label,
  className = '',
  showLabel = true,
  compact = false,
}) {
  const p = Math.min(1, Math.max(0, progress))
  const active = phase === 'pressing' || phase === 'charging' || phase === 'unlocked'
  const releasing = phase === 'releasing'
  const idle = phase === 'idle'

  const scale =
    phase === 'unlocked'
      ? HOLD_VISUAL.chargedScale
      : active
        ? HOLD_VISUAL.pressScale + (HOLD_VISUAL.chargedScale - HOLD_VISUAL.pressScale) * p
        : 1

  const glow = active || releasing ? HOLD_VISUAL.glowOpacityMax * (0.35 + p * 0.65) : 0.18
  const dashOffset = C * (1 - (idle ? 0 : p))
  const resolvedLabel =
    label ??
    (phase === 'unlocked'
      ? HOLD_COPY.unlocked
      : active
        ? HOLD_COPY.holding
        : HOLD_COPY.idle)

  return (
    <div
      className={[
        'cw-press-hold',
        `cw-press-hold--${phase}`,
        compact ? 'cw-press-hold--compact' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        '--cw-hold-progress': String(p),
        '--cw-hold-scale': String(scale),
        '--cw-hold-glow': String(glow),
        '--cw-hold-dash': String(C),
        '--cw-hold-dash-offset': String(dashOffset),
      }}
      data-testid="press-hold-orb"
      data-hold-phase={phase}
      aria-hidden="true"
    >
      <div className="cw-press-hold__depth" />
      <div className="cw-press-hold__glow" />
      <div className="cw-press-hold__orb">
        <svg
          className="cw-press-hold__ring"
          width={compact ? 56 : SIZE}
          height={compact ? 56 : SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
        >
          <circle
            className="cw-press-hold__track"
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            strokeWidth={STROKE}
          />
          <circle
            className="cw-press-hold__progress"
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            strokeWidth={STROKE}
            strokeDasharray={C}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </svg>
        <span className="cw-press-hold__core" />
      </div>
      {showLabel ? <p className="cw-press-hold__label">{resolvedLabel}</p> : null}
    </div>
  )
}

export default PressHoldOrb
