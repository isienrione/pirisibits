/**
 * Soft full-bleed darken — museum lighting, not a scene cut.
 * `intensity` 0–1 drives overlay opacity via CSS variable.
 */
export function AtmosphereDim({
  intensity = 0,
  maxOpacity = 0.42,
  className = '',
  style,
  ...rest
}) {
  const opacity = Math.max(0, Math.min(1, intensity)) * maxOpacity

  return (
    <div
      className={`cw-atmosphere-dim${className ? ` ${className}` : ''}`}
      style={{
        opacity,
        ...style,
      }}
      aria-hidden
      {...rest}
    />
  )
}
