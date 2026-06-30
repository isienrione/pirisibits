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
              ? 'border border-ivory/15 bg-ivory/5'
              : 'border border-parchment/70 bg-ivory/80'
          )}
        >
          <span
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
              isDark ? 'bg-ivory/10 text-ivory' : 'bg-parchment text-deep-slate'
            )}
          >
            {index + 1}
          </span>
          <span className={cn('text-sm font-medium', isDark ? 'text-ivory/90' : 'text-deep-slate')}>
            {stop.title}
          </span>
        </li>
      ))}
    </ol>
  )
}

export default PreviewStopsList
