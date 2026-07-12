/** Full-bleed background photo layer for IMMERSION screens */
export function PhotoHero({ src, brightness = 0.45, position = 'center', extraFilter = '' }) {
  const filter = [`brightness(${brightness})`, extraFilter].filter(Boolean).join(' ')
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${src})`,
        backgroundSize: 'cover',
        backgroundPosition: position,
        filter,
      }}
    />
  )
}
