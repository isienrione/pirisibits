import { cn } from './cn'
import { pageContainer, pageShell } from './styles'

export function PageShell({ children, className, containerClassName }) {
  return (
    <div className={cn(pageShell, className)}>
      <div className={cn(pageContainer, containerClassName)}>{children}</div>
    </div>
  )
}

export default PageShell
