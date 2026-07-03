import { cn } from './cn'
import { cardSurface, cardSurfaceStyle } from './styles'

/** Daylight surface card — flat bone, token borders only. */
export function GlassPanel({ as: Component = 'div', className, grain: _grain = false, children, style, ...props }) {
  return (
    <Component
      className={cn(cardSurface, className)}
      style={{ ...cardSurfaceStyle, ...style }}
      {...props}
    >
      {children}
    </Component>
  )
}
