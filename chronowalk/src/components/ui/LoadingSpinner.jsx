import { cn } from './cn'
import { useReducedMotion } from '../../hooks/useReducedMotion'

const SIZE_CLASS = {
  sm: 'h-8 w-8 border-[1.5px]',
  md: 'h-10 w-10 border-2',
}

export function LoadingSpinner({ size = 'md', className }) {
  const reducedMotion = useReducedMotion()

  return (
    <div
      className={cn(
        'rounded-full border-gold/25 border-t-gold',
        SIZE_CLASS[size] ?? SIZE_CLASS.md,
        !reducedMotion && 'animate-spin',
        className
      )}
      aria-hidden="true"
    />
  )
}

export default LoadingSpinner
