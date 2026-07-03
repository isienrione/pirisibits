import { Button } from './Button'
import { cn } from './cn'

/** Primary CTA alias — accent fill per DESIGN LAW. */
export function BronzeButton({ className, variant = 'primary', ...props }) {
  return <Button variant={variant} className={cn(className)} {...props} />
}

export default BronzeButton
