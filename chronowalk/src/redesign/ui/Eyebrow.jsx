import { T, F } from '../tokens.js'

export function Eyebrow({ children, color = T.ember, hairline = false }) {
  return (
    <div>
      <span
        style={{
          display: 'block',
          fontFamily: F.body,
          fontSize: 10,
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color,
          fontWeight: 500,
        }}
      >
        {children}
      </span>
      {hairline ? (
        <div
          style={{
            width: 28,
            height: 1.5,
            background: color,
            marginTop: 5,
            borderRadius: 1,
          }}
        />
      ) : null}
    </div>
  )
}
