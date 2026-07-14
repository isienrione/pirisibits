import { T, F, S, SCREEN_HEADER_PAD } from '../tokens.js'
import { IconButton } from './IconButton.jsx'

/**
 * Shared shell screen header.
 *
 * layouts:
 * - brand  — mark row + title below (My Tour)
 * - split  — title left, trailing/settings right (Journal)
 * - plain  — title + optional subtitle only (Stops)
 */
export function ScreenHeader({
  layout = 'plain',
  title,
  titleSize = 32,
  titleLetterSpacing,
  subtitle,
  metaLeft,
  metaRight,
  brand = null,
  onSettings,
  trailing = null,
  children = null,
  padding = SCREEN_HEADER_PAD,
  style,
}) {
  const titleStyle = {
    fontFamily: F.display,
    fontSize: titleSize,
    fontWeight: 300,
    color: T.ink,
    lineHeight: titleSize >= 32 ? 1.05 : 1.15,
    margin: 0,
    letterSpacing: titleLetterSpacing ?? (layout === 'brand' ? '0.02em' : undefined),
  }

  return (
    <div style={{ padding, flexShrink: 0, position: 'relative', zIndex: 2, ...style }}>
      {layout === 'brand' ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: S.l,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: S.s }}>{brand}</div>
          {onSettings ? <IconButton onClick={onSettings} label="Settings" /> : null}
        </div>
      ) : null}

      {layout === 'split' ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: S.m,
            gap: S.s,
          }}
        >
          <h1 style={{ ...titleStyle, maxWidth: '70%' }}>{title}</h1>
          <div style={{ display: 'flex', gap: S.s, alignItems: 'center' }}>
            {trailing}
            {onSettings ? <IconButton onClick={onSettings} label="Settings" /> : null}
          </div>
        </div>
      ) : (
        <h1
          style={{
            ...titleStyle,
            marginBottom: subtitle || metaLeft != null ? S.m : 0,
          }}
        >
          {title}
        </h1>
      )}

      {metaLeft != null || metaRight != null ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: S.m,
            marginTop: layout === 'brand' ? S.s : 0,
          }}
        >
          <span style={{ fontSize: 12, color: T.muted, letterSpacing: '0.04em' }}>{metaLeft}</span>
          <span
            style={{
              fontSize: 12,
              color: T.muted,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.04em',
            }}
          >
            {metaRight}
          </span>
        </div>
      ) : null}

      {subtitle ? <p style={{ fontSize: 14, color: T.muted, margin: 0 }}>{subtitle}</p> : null}

      {children}
    </div>
  )
}
