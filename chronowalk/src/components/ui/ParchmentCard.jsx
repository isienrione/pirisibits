import { cn } from './cn'
import { tapAction } from './focusRing'
import { usePressHandlers } from './usePressHandlers'

/**
 * Museum-plaque card surface — warm paper, soft depth, optional fiber texture.
 */
export function ParchmentCard({
  as: Component = 'div',
  className,
  texture = true,
  children,
  onClick,
  onPointerUp,
  onPointerDown,
  onPointerCancel,
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
      className={cn(
        'rounded-3xl border border-parchment/80 bg-ivory shadow-plaque',
        texture && 'paper-texture relative overflow-hidden',
        isInteractive && tapAction,
        className
      )}
      {...props}
      {...(isInteractive ? pressHandlers : onClick ? { onClick } : {})}
    >
      {children}
    </Component>
  )
}

export default ParchmentCard
