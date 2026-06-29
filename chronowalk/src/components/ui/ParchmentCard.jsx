import { cn } from './cn'
import { tapAction } from './focusRing'

/**
 * Museum-plaque card surface — warm paper, soft depth, optional fiber texture.
 */
export function ParchmentCard({
  as: Component = 'div',
  className,
  texture = true,
  children,
  ...props
}) {
  const isInteractive =
    Component === 'button' ||
    Component === 'a' ||
    props.role === 'button' ||
    props.type === 'button'

  return (
    <Component
      className={cn(
        'rounded-3xl border border-parchment/80 bg-ivory shadow-plaque',
        texture && 'paper-texture relative overflow-hidden',
        isInteractive && tapAction,
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}

export default ParchmentCard
