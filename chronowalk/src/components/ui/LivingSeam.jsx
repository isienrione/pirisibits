import { cn } from './cn'

/**
 * Breathing ember hairline — extracted from the Threshold seam vocabulary.
 * 1.5px line, opacity .7→1 over 3s, --seam-glow.
 */
export function LivingSeam({ className, vertical = true, style }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'pointer-events-none block shrink-0 bg-ember animate-living-seam',
        vertical ? 'h-full w-[1.5px]' : 'h-[1.5px] w-full',
        className
      )}
      style={{
        boxShadow: 'var(--seam-glow)',
        ...style,
      }}
    />
  )
}

export default LivingSeam
