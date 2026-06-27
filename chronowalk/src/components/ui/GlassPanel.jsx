import { cn } from './cn'
import { motionBase } from './styles'

const variants = {
  default:
    'border-limestone/70 bg-warm-white/92 shadow-glass backdrop-blur-glass',
  elevated:
    'border-limestone/60 bg-warm-white/96 shadow-glass-lg backdrop-blur-glass',
  callout:
    'border-gold/30 bg-gold/[0.05] shadow-glass backdrop-blur-glass',
}

export function GlassPanel({
  as: Component = 'div',
  variant = 'default',
  className,
  children,
  ...props
}) {
  return (
    <Component
      className={cn(
        'rounded-3xl border motion-reduce:transition-none motion-safe:transition-[box-shadow,border-color,transform]',
        motionBase,
        variants[variant] ?? variants.default,
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}
