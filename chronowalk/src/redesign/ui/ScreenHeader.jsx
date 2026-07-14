import { T, S, SCREEN_HEADER_PAD } from '../tokens.js'
import { TYPE, TYPE_SPACE, displayTitleStyle } from '../typography.js'
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
    ...displayTitleStyle(titleSize),
    color: T.ink,
    letterSpacing: titleLetterSpacing ?? displayTitleStyle(titleSize).letterSpacing,
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
            marginBottom: subtitle || metaLeft != null ? TYPE_SPACE.afterDisplay : 0,
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
          <span style={{ ...TYPE.meta, color: T.muted }}>{metaLeft}</span>
          <span
            style={{
              ...TYPE.meta,
              color: T.muted,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {metaRight}
          </span>
        </div>
      ) : null}

      {subtitle ? (
        <p style={{ ...TYPE.subtitle, color: T.muted }}>{subtitle}</p>
      ) : null}

      {children}
    </div>
  )
}
