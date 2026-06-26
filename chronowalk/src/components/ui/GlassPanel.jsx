import { cn } from './cn'

export function GlassPanel({ as: Component = 'div', className, children, ...props }) {
  return (
    <Component
      className={cn(
        'rounded-3xl border border-limestone/70 bg-warm-white/92 shadow-glass backdrop-blur-glass',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}
