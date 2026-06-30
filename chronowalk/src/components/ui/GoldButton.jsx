import { Button } from './Button'
import { cn } from './cn'

function ArrowRightIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h12m0 0-4-4m4 4-4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Primary gold CTA — mockup-style cinematic tour start button.
 */
export function GoldButton({ className, showArrow = false, children, ...props }) {
  return (
    <Button
      size="lg"
      className={cn(
        'border border-gold/35 bg-gradient-to-b from-gold via-[#d4af37] to-[#b8942f] font-display text-ivory shadow-gold-glow',
        'hover:from-gold/95 hover:via-[#d4af37]/95 hover:to-[#b8942f]/95',
        'active:from-[#b8942f] active:to-gold/90',
        showArrow && 'justify-between px-6',
        className
      )}
      {...props}
    >
      <span className={cn(showArrow && 'flex-1 text-center')}>{children}</span>
      {showArrow ? <ArrowRightIcon className="h-5 w-5 shrink-0" /> : null}
    </Button>
  )
}

export default GoldButton
