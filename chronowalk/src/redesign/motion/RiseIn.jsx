import { FadeReveal } from './FadeReveal.jsx'
import { MOTION_CATEGORIES, motionVars } from './tokens.js'

/**
 * Category-aware rise-in — shared enter primitive for nav / journal / onboarding.
 * Prefer this over one-off opacity+translate transitions.
 */
export function RiseIn({
  category = 'navigation',
  show = true,
  duration,
  delay = 0,
  y,
  as,
  className = '',
  style,
  children,
  ...rest
}) {
  const preset = MOTION_CATEGORIES[category] ?? MOTION_CATEGORIES.navigation

  return (
    <FadeReveal
      show={show}
      duration={duration ?? preset.duration}
      delay={delay}
      y={y ?? preset.liftPx}
      as={as}
      className={`cw-rise-in cw-rise-in--${category}${className ? ` ${className}` : ''}`}
      style={{ ...motionVars(category), ...style }}
      {...rest}
    >
      {children}
    </FadeReveal>
  )
}
