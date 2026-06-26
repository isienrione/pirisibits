import { cn } from './cn'
import {
  statusArrived,
  statusCurrent,
  statusNeutral,
  statusPill,
  statusWalking,
} from './styles'

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
