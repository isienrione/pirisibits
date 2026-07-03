import { cn } from './cn'
import { tapAction } from './focusRing'
import { usePressHandlers } from './usePressHandlers'
import { cardSurface, cardSurfaceStyle } from './styles'

/** Daylight card surface — flat bone, no texture. */
export function ParchmentCard({
  as: Component = 'div',
  className,
  texture: _texture = true,
  children,
  onClick,
  onPointerUp,
  onPointerDown,
  onPointerCancel,
  style,
  ...props
}) {
  const isInteractive =
    Component === 'button' ||
    Component === 'a' ||
    props.role === 'button' ||
    props.type === 'button'

  const pressHandlers = usePressHandlers(isInteractive ? onClick : undefined, {
    onPointerUp,
    onPointerDown,
    onPointerCancel,
  })

  return (
    <Component
      className={cn(cardSurface, isInteractive && tapAction, className)}
      style={{ ...cardSurfaceStyle, ...style }}
      {...props}
      {...(isInteractive ? pressHandlers : onClick ? { onClick } : {})}
    >
      {children}
    </Component>
  )
}

export default ParchmentCard
