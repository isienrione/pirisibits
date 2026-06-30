import { cn } from './cn'
import { focusRing } from './focusRing'

export function Toggle({ checked, onChange, label, disabled = false, className }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onClick={() => {
        if (!disabled) onChange(!checked)
      }}
      className={cn(
        'inline-flex min-h-11 min-w-11 items-center justify-center rounded-full',
        focusRing,
        disabled && 'cursor-not-allowed opacity-60',
        className
      )}
    >
      <span
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
          checked ? 'bg-olive' : 'bg-limestone/90',
          disabled && 'opacity-80'
        )}
        aria-hidden="true"
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-warm-white shadow-sm transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </span>
    </button>
  )
}

export default Toggle
