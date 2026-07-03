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

/** Primary accent CTA — flat token fill, no gradients. */
export function GoldButton({ className, showArrow = false, children, ...props }) {
  return (
    <Button
      size="lg"
      className={cn(showArrow && 'justify-between px-6', className)}
      {...props}
    >
      <span className={cn(showArrow && 'flex-1 text-center')}>{children}</span>
      {showArrow ? <ArrowRightIcon className="h-5 w-5 shrink-0" /> : null}
    </Button>
  )
}

export default GoldButton
