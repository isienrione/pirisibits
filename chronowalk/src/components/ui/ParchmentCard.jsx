import { cn } from './cn'

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
  return (
    <Component
      className={cn(
        'rounded-3xl border border-parchment/80 bg-ivory shadow-plaque',
        texture && 'paper-texture relative overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}

export default ParchmentCard
