import { T } from '../tokens.js'

/** EXPLORER daylight surface — bone background + paper grain overlay */
export function GrainSurface({ children, style }) {
  return (
    <div
      className="cw-grain"
      style={{
        background: T.bone,
        height: '100%',
        position: 'relative',
        fontFamily: "'DM Sans', sans-serif",
        ...style,
      }}
    >
      {children}
    </div>
  )
}
