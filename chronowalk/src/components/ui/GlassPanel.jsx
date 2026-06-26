import { cn } from './cn'

export function GlassPanel({ as: Component = 'div', className, children, ...props }) {
  return (
    <Component
      className={cn(
        'rounded-panel border border-limestone/70 bg-warm-white/88 shadow-glass backdrop-blur-glass',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}
