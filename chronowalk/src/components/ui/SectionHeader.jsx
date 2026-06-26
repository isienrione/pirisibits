import { cn } from './cn'

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
      {eyebrow ? (
        <p className="text-eyebrow uppercase text-terracotta">{eyebrow}</p>
      ) : null}
      {title ? (
        <h2
          className={cn(
            'font-display text-3xl font-semibold leading-tight tracking-tight text-deep-slate',
            eyebrow && 'mt-2',
            titleClassName
          )}
        >
          {title}
        </h2>
      ) : null}
      {subtitle ? (
        <p className="mt-3 text-sm leading-relaxed text-soft-slate">{subtitle}</p>
      ) : null}
    </header>
  )
}
