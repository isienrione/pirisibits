import { cn } from './cn'
import {
  blockSpacing,
  typeBodySmMuted,
  typeEyebrow,
  typeSectionTitle,
} from './typography'

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  className,
  titleClassName,
}) {
  const alignClass =
    align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center'

  return (
    <header className={cn(alignClass, className)}>
      {eyebrow ? <p className={typeEyebrow}>{eyebrow}</p> : null}
      {title ? (
        <h2
          className={cn(
            typeSectionTitle,
            eyebrow && 'mt-3',
            titleClassName
          )}
        >
          {title}
        </h2>
      ) : null}
      {subtitle ? (
        <p className={cn(typeBodySmMuted, blockSpacing)}>{subtitle}</p>
      ) : null}
    </header>
  )
}
