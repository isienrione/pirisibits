/**
 * Extremely slow ken-burns drift. Presence, not spectacle.
 */
export function SubtleDrift({
  active = false,
  duration = 28000,
  scale = 1.055,
  className = '',
  style,
  children,
  ...rest
}) {
  return (
    <div
      className={[
        'cw-subtle-drift',
        active ? 'cw-subtle-drift--active' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        '--cw-drift-duration': `${duration}ms`,
        '--cw-drift-scale': scale,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  )
}
