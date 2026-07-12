import { cn } from '../ui'

export default function ArrivalMonumentIcon({ className }) {
  return (
    <div
      className={cn(
        'relative flex h-28 w-28 items-center justify-center rounded-full border border-gold/35 bg-gold/[0.08] shadow-gold-glow motion-safe:animate-medallion-breathe sm:h-32 sm:w-32',
        className
      )}
      aria-hidden="true"
    >
      <div className="pointer-events-none absolute inset-3 rounded-full border border-gold/20" />
      <svg className="h-14 w-14 text-gold/90 sm:h-16 sm:w-16" viewBox="0 0 64 64" fill="none">
        <path
          d="M12 52h40M16 52V28l16-12 16 12v24"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M22 28h20M20 22h24l-2-6H18l2 6Z"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M26 36h4v16h-4M34 36h4v16h-4"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}
