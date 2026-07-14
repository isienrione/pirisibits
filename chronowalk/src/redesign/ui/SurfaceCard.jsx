import { T } from '../tokens.js'

/**
 * Shared surface chrome for stop / memory / letter cards.
 * tone + radius preserve existing My Tour / Stops / Journal recipes.
 */
export function SurfaceCard({
  children,
  tone = 'light',
  radius = 12,
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
