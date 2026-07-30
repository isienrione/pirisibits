import { T } from '../tokens.js'

/** Node dot on the act spine - three visual states */
export function ActNode({ status, color, radius = 7 }) {
  const size = radius * 2
  const base = {
    width: size,
    height: size,
    borderRadius: radius,
    zIndex: 2,
  }

  if (status === 'current') {
    return (
      <div
        style={{
          ...base,
          background: color,
          boxShadow: `0 0 0 5px ${color}28, 0 0 14px ${color}70`,
          animation: 'presencePulse 3s ease-in-out infinite',
        }}
      />
    )
  }
  if (status === 'done') {
    return <div style={{ ...base, background: color }} />
  }
  return (
    <div
      style={{
        ...base,
        background: T.bone,
        border: `1.5px solid ${T.ink800}`,
      }}
    />
  )
}
