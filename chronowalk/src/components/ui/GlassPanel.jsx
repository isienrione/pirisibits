import { cn } from './cn'

export function GlassPanel({ as: Component = 'div', className, grain = false, children, ...props }) {
  return (
    <Component
      className={cn(
        'rounded-3xl border border-parchment/80 bg-ivory/95 shadow-plaque backdrop-blur-glass',
        grain && 'paper-texture relative overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
      {grain ? <div className="grain-overlay" aria-hidden="true" /> : null}
    </Component>
  )
}
