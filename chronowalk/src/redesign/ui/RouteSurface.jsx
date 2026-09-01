import { T, F } from '../tokens.js'

/**
 * Ivory travel-app surface for T05 route screens.
 * Maps onto the existing Home palette — do not invent a second token set.
 */
export const R = {
  bg: T.bone,
  card: '#FFFFFF',
  cardWarm: '#FBF8F2',
  ink: T.ink,
  /** Readable secondary copy on ivory. Never T.muted (#B9AF9C). */
  muted: `color-mix(in srgb, ${T.ink} 62%, ${T.limestone})`,
  line: T.limestone,
  gold: T.gold,
  teal: T.actIV,
  sage: T.actII,
  terracotta: T.terracotta,
  violet: T.encore,
  blue: T.actVI,
  olive: T.olive,
  shadow: '0 8px 20px rgba(26, 22, 18, 0.05)',
  shadowSheet: '0 -8px 40px rgba(26, 22, 18, 0.12)',
  overlay: 'rgba(26, 26, 31, 0.28)',
  cardFill: 'linear-gradient(180deg, #FFFFFF 0%, #FBF8F2 100%)',
  primaryShadow: '0 8px 18px rgba(212, 175, 55, 0.22)',
}

export const routeCard = {
  background: R.cardFill,
  border: `1px solid ${R.line}`,
  borderRadius: 20,
  boxShadow: R.shadow,
  color: R.ink,
  padding: 16,
}

export const routeGhost = {
  minHeight: 48,
  color: R.ink,
  borderColor: R.line,
  background: 'transparent',
  boxShadow: 'none',
  backdropFilter: 'none',
}

export const routePrimary = {
  minHeight: 48,
  boxShadow: R.primaryShadow,
}

export const routeChip = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '5px 10px',
  borderRadius: 999,
  fontFamily: F.body,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: R.ink,
  background: R.cardWarm,
  border: `1px solid ${R.line}`,
}

export const routeOverlay = {
  position: 'fixed',
  inset: 0,
  zIndex: 130,
  background: R.overlay,
  display: 'flex',
  alignItems: 'flex-end',
}

export const routeSheet = {
  position: 'relative',
  width: '100%',
  maxHeight: '88dvh',
  overflowY: 'auto',
  background: R.bg,
  border: `1px solid ${R.line}`,
  borderBottom: 'none',
  borderRadius: '24px 24px 0 0',
  boxShadow: R.shadowSheet,
  padding: '22px 22px max(22px, calc(env(safe-area-inset-bottom) + 14px))',
  boxSizing: 'border-box',
  color: R.ink,
}

export function RouteSurface({ testId, children, style, header, ...rest }) {
  return (
    <div
      data-testid={testId}
      data-bright="true"
      className="native-route-surface"
      {...rest}
      style={{
        minHeight: '100%',
        background: R.bg,
        color: R.ink,
        padding: header
          ? '0 20px calc(var(--shell-tab-bar-height, 72px) + 16px)'
          : 'max(20px, calc(env(safe-area-inset-top) + 12px)) 20px calc(var(--shell-tab-bar-height, 72px) + 16px)',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {header}
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
