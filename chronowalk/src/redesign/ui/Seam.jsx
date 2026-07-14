import { T } from '../tokens.js'
import { GoldSeam } from './GoldSeam.jsx'

/**
 * Legacy Seam — thin wrapper over GoldSeam for existing call sites.
 * Prefer `GoldSeam` + a `moment` preset for new meaningful-moment usages.
 * Do not use for decoration; structural spines may keep raw lines.
 */
export function Seam({ variant = 'vertical', accent = T.gold, pct = 0, style: extra = {} }) {
  return (
    <GoldSeam
      variant={variant}
      motion={variant === 'progress' ? 'none' : 'breathe'}
      accent={accent}
      pct={pct}
      loop={variant !== 'progress'}
      layout="fill"
      style={extra}
    />
  )
}
