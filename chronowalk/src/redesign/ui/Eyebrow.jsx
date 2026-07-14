import { T } from '../tokens.js'
import { TYPE, TYPE_SPACE } from '../typography.js'

export function Eyebrow({ children, color = T.gold, hairline = false }) {
  return (
    <div style={{ marginBottom: hairline ? 0 : undefined }}>
      <span
        style={{
          display: 'block',
          ...TYPE.kicker,
          color,
          margin: 0,
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
            marginTop: 6,
            borderRadius: 1,
          }}
        />
      ) : null}
    </div>
  )
}

/** Default space after a kicker before a display title. */
export const EYEBROW_AFTER = TYPE_SPACE.afterKicker
