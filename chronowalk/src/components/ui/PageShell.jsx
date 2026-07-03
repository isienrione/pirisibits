import { cn } from './cn'
import { pageContainer, pageShell, pageShellStyle } from './styles'

export function PageShell({ children, className, containerClassName }) {
  return (
    <div className={cn(pageShell, className)} style={pageShellStyle}>
      <div className={cn(pageContainer, containerClassName)}>{children}</div>
    </div>
  )
}

export default PageShell
