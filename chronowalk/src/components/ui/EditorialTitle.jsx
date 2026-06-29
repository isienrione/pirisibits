import { cn } from './cn'

/**
 * Display typography for monument names, hero headlines, and editorial moments.
 */
export function EditorialTitle({
  as: Component = 'h1',
  eyebrow,
  subtitle,
  italicHighlight,
  align = 'left',
  size = 'lg',
  className,
  titleClassName,
  children,
}) {
  const sizeStyles = {
    sm: 'text-2xl sm:text-3xl',
    md: 'text-3xl sm:text-4xl',
    lg: 'text-[2rem] sm:text-4xl lg:text-[2.75rem]',
    xl: 'text-4xl sm:text-5xl',
  }

  const alignStyles = {
    left: 'text-left',
    center: 'text-center',
  }

  return (
    <div className={cn(alignStyles[align], className)}>
      {eyebrow ? (
        <p className="text-eyebrow uppercase tracking-[0.2em] text-bronze">{eyebrow}</p>
      ) : null}
      <Component
        className={cn(
          'font-display font-semibold leading-[1.08] tracking-tight text-deep-slate',
          sizeStyles[size],
          eyebrow && 'mt-3',
          titleClassName
        )}
      >
        {children}
        {italicHighlight ? (
          <>
            {' '}
            <span className="font-display italic text-bronze">{italicHighlight}</span>
          </>
        ) : null}
      </Component>
      {subtitle ? (
        <p className="mt-4 max-w-prose text-base leading-relaxed text-soft-slate sm:text-[1.05rem]">
          {subtitle}
        </p>
      ) : null}
    </div>
  )
}

export default EditorialTitle
