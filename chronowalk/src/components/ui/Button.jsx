import { cn } from './cn'
import { focusRing } from './focusRing'

const variantStyles = {
  primary:
    'border border-bronze/25 bg-gradient-to-b from-bronze via-bronze to-[#8f6324] text-ivory shadow-bronze-cta hover:from-bronze/95 hover:to-[#8f6324]/95 active:from-[#8f6324] active:to-bronze/90 motion-safe:active:scale-[0.98]',
  secondary:
    'border border-bronze/40 bg-ivory text-deep-slate hover:border-bronze/60 hover:bg-parchment/50 motion-safe:active:scale-[0.98]',
  ghost:
    'border border-bronze/30 bg-bronze/8 text-bronze hover:bg-bronze/12',
  text: 'bg-transparent text-bronze hover:text-bronze/80 underline-offset-2 hover:underline',
}

const sizeStyles = {
  sm: 'min-h-10 px-4 py-2 text-xs font-semibold rounded-full',
  md: 'min-h-11 px-5 py-3 text-sm font-semibold rounded-2xl',
  lg: 'min-h-[3.25rem] px-6 py-3.5 text-base font-bold rounded-full',
  pill: 'min-h-11 px-6 py-3.5 text-sm font-bold rounded-full',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  type = 'button',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-[color,background-color,border-color,box-shadow,transform] duration-200',
        focusRing,
        'disabled:pointer-events-none disabled:opacity-50',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
