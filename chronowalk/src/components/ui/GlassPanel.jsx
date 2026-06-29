import { cn } from './cn'

export function GlassPanel({ as: Component = 'div', className, grain = false, children, ...props }) {
  return (
    <Component
      className={cn(
        'rounded-3xl border border-limestone/70 bg-warm-white/92 shadow-glass backdrop-blur-glass',
        grain && 'relative overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
      {grain ? <div className="grain-overlay" aria-hidden="true" /> : null}
    </Component>
  )
}
