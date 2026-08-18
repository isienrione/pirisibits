import { T, F } from '../tokens.js'

/** Ivory travel-app surface for T05 route screens. */
export const R = {
  bg: T.bone,
  card: '#FFFFFF',
  ink: T.ink,
  muted: '#6F675C',
  line: 'rgba(26,26,31,0.10)',
  gold: T.gold,
  teal: T.actIV,
  sage: T.actII,
  coral: '#E07A5F',
}

export function RouteSurface({ testId, children, style }) {
  return (
    <div
      data-testid={testId}
      style={{
        minHeight: '100%',
        background: R.bg,
        color: R.ink,
        padding: 'max(20px, calc(env(safe-area-inset-top) + 12px)) 20px calc(var(--shell-tab-bar-height, 72px) + 16px)',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export const routeType = {
  fontFamily: F.body,
  fontSize: 11,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: R.muted,
  margin: 0,
}

export const routeHeadline = {
  fontFamily: F.display,
  fontWeight: 400,
  fontSize: 30,
  lineHeight: 1.15,
  margin: '10px 0 12px',
  color: R.ink,
}
