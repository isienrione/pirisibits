import { CONTENT_TYPES } from '../../content/registry/constants.js'
import { F, T } from '../tokens.js'
import { useT } from '../../i18n/I18nProvider.jsx'
import { R } from './RouteSurface.jsx'

export function formatDuration(minutes) {
  if (!Number.isFinite(minutes)) return ''
  if (minutes < 60) return `${minutes} min`
  const hours = minutes / 60
  return hours === 1 ? '1 hour' : `${hours} hours`
}

export function formatDistance(distanceM) {
  if (!Number.isFinite(distanceM)) return null
  if (distanceM < 1000) return `${Math.round(distanceM)} m`
  return `${(distanceM / 1000).toFixed(1)} km`
}

export function contentKindLabel(item, t) {
  if (item?.contentType === CONTENT_TYPES.DISCOVERY) return t('native.content.notice')
  return t('native.content.experience')
}

export default function NativeContentCard({
  item,
  primary = false,
  onOpen,
  coverageLabel,
  testId,
  tone = 'dark',
}) {
  const t = useT()
  if (!item) return null
  const discovery = item.contentType === CONTENT_TYPES.DISCOVERY
  const media = item.mediaResolved
  const warm = tone === 'warm'
  const chipBg = item.locked
    ? warm
      ? R.cardWarm
      : 'rgba(11,11,13,0.72)'
    : discovery
      ? warm
        ? `color-mix(in srgb, ${R.teal} 18%, ${R.cardWarm})`
        : 'rgba(250,246,239,0.14)'
      : T.gold
  const chipColor = item.locked
    ? warm
      ? R.ink
      : T.bone
    : discovery
      ? warm
        ? R.ink
        : T.bone
      : T.ink
  return (
    <article
      data-testid={testId}
      data-content-type={item.contentType}
      data-asset-source={import.meta.env.DEV ? media?.source : undefined}
      style={{
        borderRadius: primary ? 20 : discovery ? 14 : 16,
        overflow: 'hidden',
        background: warm ? R.cardFill : T.charcoal,
        border: warm ? `1px solid ${R.line}` : 'none',
        boxShadow: warm ? R.shadow : 'none',
        marginBottom: primary ? 16 : 12,
        opacity: item.completed ? 0.78 : 1,
      }}
    >
      <button
        type="button"
        onClick={() => onOpen?.(item)}
        style={{
          display: 'block',
          width: '100%',
          border: 'none',
          padding: 0,
          background: 'transparent',
          textAlign: 'left',
          color: warm ? R.ink : T.bone,
        }}
      >
        <div
          style={{
            height: primary ? 210 : discovery ? 110 : 128,
            backgroundImage: item.photo ? `url(${item.photo})` : 'none',
            backgroundSize: discovery && media?.source === 'brand' ? '40%' : 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundColor: warm ? R.line : T.charcoal,
            position: 'relative',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              padding: '5px 10px',
              borderRadius: 999,
              background: chipBg,
              color: chipColor,
              fontFamily: F.body,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              border: warm ? `1px solid ${R.line}` : 'none',
            }}
          >
            {item.locked ? coverageLabel || t('native.content.locked') : contentKindLabel(item, t)}
          </span>
        </div>
        <div style={{ padding: primary ? '16px 16px 14px' : '12px 14px 12px' }}>
          <h2
            style={{
              margin: 0,
              fontFamily: F.display,
              fontSize: primary ? 26 : discovery ? 18 : 20,
              fontWeight: 400,
              lineHeight: 1.2,
              color: warm ? R.ink : T.bone,
            }}
          >
            {item.title}
          </h2>
          <p
            style={{
              margin: '8px 0 0',
              color: warm ? R.muted : 'rgba(250,246,239,0.78)',
              fontSize: primary ? 15 : 14,
              lineHeight: 1.4,
              fontFamily: F.body,
            }}
          >
            {item.whyWorthIt}
          </p>
          <p style={{ margin: '10px 0 0', color: warm ? R.muted : T.muted, fontSize: 13, fontFamily: F.body }}>
            {[formatDistance(item.distanceM), formatDuration(item.timeCostMin), item.whyReasons?.[1] || item.whyReasons?.[0]]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      </button>
    </article>
  )
}
