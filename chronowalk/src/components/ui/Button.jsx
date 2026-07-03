import { cn } from './cn'
import { focusRing, tapAction } from './focusRing'
import { usePressHandlers } from './usePressHandlers'

const variantStyles = {
  primary: 'border border-ember bg-ember text-inkonfill hover:opacity-95 active:opacity-90',
  quiet: 'border border-ink800 bg-transparent text-bone hover:opacity-90',
  ghost: 'border border-transparent bg-transparent text-bone hover:opacity-80',
}

const sizeStyles = {
  sm: 'min-h-12 px-5 py-3 text-sm font-semibold rounded-full',
  md: 'min-h-12 px-6 py-3.5 text-sm font-semibold rounded-2xl',
  lg: 'min-h-14 px-6 py-4 text-base font-bold rounded-full',
  pill: 'min-h-12 px-6 py-3.5 text-sm font-bold rounded-full',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  type = 'button',
  children,
  onClick,
  onPointerUp,
  onPointerDown,
  onPointerCancel,
  ...props
}) {
  const pressHandlers = usePressHandlers(onClick, {
    onPointerUp,
    onPointerDown,
    onPointerCancel,
  })

  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-sans transition-opacity duration-200',
        tapAction,
        focusRing,
        'disabled:pointer-events-none disabled:opacity-50',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
      {...pressHandlers}
    >
      {children}
    </button>
  )
}
