import { cn } from './cn'
import { displayLg, displayMd } from './styles'

const eyebrowTones = {
  terracotta: 'text-terracotta',
  gold: 'text-gold',
  slate: 'text-soft-slate',
}

export function SectionHeader({
  eyebrow,
  eyebrowTone = 'terracotta',
  title,
  subtitle,
  align = 'center',
  as: TitleTag = 'h2',
  size = 'lg',
  className,
  titleClassName,
}) {
  const alignClass =
    align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center'

  const titleSize = size === 'md' ? displayMd : displayLg

  return (
    <header className={cn(alignClass, className)}>
      {eyebrow ? (
        <p className={cn('text-eyebrow uppercase', eyebrowTones[eyebrowTone] ?? eyebrowTones.terracotta)}>
          {eyebrow}
        </p>
      ) : null}
      {title ? (
        <TitleTag
          className={cn(titleSize, eyebrow && 'mt-2', titleClassName)}
        >
          {title}
        </TitleTag>
      ) : null}
      {subtitle ? (
        <p className="mt-3 text-sm leading-relaxed text-soft-slate">{subtitle}</p>
      ) : null}
    </header>
  )
}
