import { CONTENT_TYPES } from '../../content/registry/constants.js'
import { F, T } from '../tokens.js'
import { useT } from '../../i18n/I18nProvider.jsx'

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
}) {
  const t = useT()
  if (!item) return null
  const discovery = item.contentType === CONTENT_TYPES.DISCOVERY
  const media = item.mediaResolved
  return (
    <article
      data-testid={testId}
      data-content-type={item.contentType}
      data-asset-source={import.meta.env.DEV ? media?.source : undefined}
      style={{
        borderRadius: primary ? 20 : discovery ? 14 : 16,
        overflow: 'hidden',
        background: T.charcoal,
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
          color: T.bone,
        }}
      >
        <div
          style={{
            height: primary ? 210 : discovery ? 110 : 128,
            backgroundImage: item.photo ? `url(${item.photo})` : 'none',
            backgroundSize: discovery && media?.source === 'brand' ? '40%' : 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundColor: '#1a1a1f',
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
              background: item.locked ? 'rgba(11,11,13,0.72)' : discovery ? 'rgba(250,246,239,0.14)' : T.gold,
              color: item.locked || discovery ? T.bone : T.obsidian,
              fontFamily: F.body,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
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
            }}
          >
            {item.title}
          </h2>
          <p style={{ margin: '8px 0 0', color: 'rgba(250,246,239,0.78)', fontSize: primary ? 15 : 14, lineHeight: 1.4 }}>
            {item.whyWorthIt}
          </p>
          <p style={{ margin: '10px 0 0', color: T.muted, fontSize: 13 }}>
            {[formatDistance(item.distanceM), formatDuration(item.timeCostMin), item.whyReasons?.[1] || item.whyReasons?.[0]]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      </button>
    </article>
  )
}
