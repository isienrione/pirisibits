import { Button } from './Button'
import { cn } from './cn'

/**
 * Primary CTA — engraved bronze with soft metallic depth.
 */
export function BronzeButton({ className, variant = 'primary', ...props }) {
  return (
    <Button
      variant={variant}
      className={cn(
        variant === 'primary' &&
          'border border-bronze/30 bg-gradient-to-b from-bronze via-bronze to-[#8f6324] text-ivory shadow-bronze-cta hover:from-bronze/95 hover:to-[#8f6324]/95 active:from-[#8f6324] active:to-bronze/90',
        className
      )}
      {...props}
    />
  )
}

export default BronzeButton
