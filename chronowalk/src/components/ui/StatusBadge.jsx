import { cn } from './cn'

export const statusPill =
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold'

export const statusWalking = 'bg-ink800 text-ember'

export const statusArrived = 'bg-ink800 text-actmarket'

export const statusNeutral = 'bg-ink800 text-muted'

export const statusLocked = 'bg-ink800 text-muted'

export const statusCurrent = 'bg-ink800 text-ember'

const VARIANTS = {
  neutral: statusNeutral,
  active: statusArrived,
  gold: statusCurrent,
  walking: statusWalking,
}

export function StatusBadge({ children, variant = 'neutral', className }) {
  return (
    <span className={cn(statusPill, 'text-[0.7rem]', VARIANTS[variant] ?? statusNeutral, className)}>
      {children}
    </span>
  )
}

export default StatusBadge
