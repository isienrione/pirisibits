export default function LetterMeander({ meander, emptyLabel = 'Your path will draw itself as you walk.' }) {
  if (!meander.points.length) {
    return (
      <div
        style={{
          height: 180,
          borderRadius: 'var(--r-card)',
          border: '1px dashed color-mix(in srgb, var(--ink) 18%, var(--bone))',
          display: 'grid',
          placeItems: 'center',
          padding: 16,
          color: 'color-mix(in srgb, var(--ink) 55%, var(--bone))',
          fontSize: 'var(--fs-secondary)',
          textAlign: 'center',
        }}
      >
        {emptyLabel}
      </div>
    )
  }

  return (
    <svg
      viewBox={meander.viewBox}
      role="img"
      aria-label="Meandering path through completed stops"
      style={{
        width: '100%',
        height: 180,
        borderRadius: 'var(--r-card)',
        background: 'color-mix(in srgb, var(--ink) 4%, var(--bone))',
      }}
    >
      <path
        d={meander.path}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
      {meander.points.map((point, index) => (
        <g key={point.id}>
          <circle
            cx={point.x}
            cy={point.y}
            r={index === meander.points.length - 1 ? 7 : 5}
            fill={index === meander.points.length - 1 ? 'var(--accent)' : 'var(--bone)'}
            stroke="var(--accent)"
            strokeWidth="2"
          />
        </g>
      ))}
    </svg>
  )
}
