import { T, R } from '../tokens.js'

/**
 * Shared surface chrome for stop / memory / letter cards.
 */
export function SurfaceCard({
  children,
  tone = 'light',
  radius = R.card,
  padding,
  style,
  as: Comp = 'div',
  ...rest
}) {
  return (
    <Comp
      style={{
        background: tone === 'dark' ? T.ink : T.warmWhite,
        borderRadius: radius,
        padding,
        overflow: 'hidden',
        ...style,
      }}
      {...rest}
    >
      {children}
    </Comp>
  )
}
