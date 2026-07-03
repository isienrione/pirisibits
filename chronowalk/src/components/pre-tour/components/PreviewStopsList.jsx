import { cn } from '../../ui'

export function PreviewStopsList({ stops, className, variant = 'dark' }) {
  const isDark = variant === 'dark'

  return (
    <ol className={cn('space-y-2', className)}>
      {stops.map((stop, index) => (
        <li
          key={stop.id}
          className={cn(
            'flex items-center gap-3 rounded-2xl px-3 py-2.5',
            isDark
              ? 'border border-ink800/15 bg-ink900/5'
              : 'border border-ink800/70 bg-ink900/80'
          )}
        >
          <span
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
              isDark ? 'bg-ink900/10 text-bone' : 'bg-ink800 text-ink900'
            )}
          >
            {index + 1}
          </span>
          <span className={cn('text-sm font-medium', isDark ? 'text-bone/90' : 'text-ink900')}>
            {stop.title}
          </span>
        </li>
      ))}
    </ol>
  )
}

export default PreviewStopsList
