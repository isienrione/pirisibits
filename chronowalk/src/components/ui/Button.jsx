import { cn } from './cn'
import { focusRing, tapAction } from './focusRing'
import { usePressHandlers } from './usePressHandlers'

const variantStyles = {
  primary:
    'border border-bronze/25 bg-gradient-to-b from-bronze via-bronze to-[#8f6324] text-ivory shadow-bronze-cta hover:from-bronze/95 hover:to-[#8f6324]/95 active:from-[#8f6324] active:to-bronze/90',
  secondary:
    'border border-bronze/40 bg-ivory text-deep-slate hover:border-bronze/60 hover:bg-parchment/50',
  ghost:
    'border border-bronze/30 bg-bronze/8 text-bronze hover:bg-bronze/12',
  text: 'bg-transparent text-bronze hover:text-bronze/80 underline-offset-2 hover:underline',
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
        'inline-flex items-center justify-center gap-2 transition-[color,background-color,border-color,box-shadow,opacity] duration-200',
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
