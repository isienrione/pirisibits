/** Dashed act-accent route line - separator between Journal act groups */
export function MiniActLine({ color }) {
  return (
    <div style={{ padding: '12px 20px 4px' }}>
      <svg width="100%" height="14" viewBox="0 0 310 14" preserveAspectRatio="none">
        <line
          x1="2"
          y1="7"
          x2="308"
          y2="7"
          stroke={color}
          strokeWidth="1.5"
          strokeDasharray="5 3"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 3px ${color}70)` }}
        />
        <circle cx="2" cy="7" r="3" fill={color} />
        <circle cx="308" cy="7" r="3" fill={color} />
      </svg>
    </div>
  )
}
