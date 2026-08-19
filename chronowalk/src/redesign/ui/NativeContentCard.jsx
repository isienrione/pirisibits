import { CONTENT_TYPES } from '../../content/registry/constants.js'
import { F, T } from '../tokens.js'
import { useT } from '../../i18n/I18nProvider.jsx'
import { isDisplayableDistanceM } from '../../lib/geoSanity.js'
import { R } from './RouteSurface.jsx'
import PlaceMedia from './PlaceMedia.jsx'

export function formatDuration(minutes) {
  if (!Number.isFinite(minutes)) return ''
  if (minutes < 60) return `${minutes} min`
  const hours = minutes / 60
  return hours === 1 ? '1 hour' : `${hours} hours`
}

export function formatDistance(distanceM) {
  if (!isDisplayableDistanceM(distanceM)) return null
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
  compact = false,
  horizontal = false,
  onOpen,
  coverageLabel,
  testId,
  tone = 'warm',
  showViewCue = false,
}) {
  const t = useT()
  if (!item) return null
  const discovery = item.contentType === CONTENT_TYPES.DISCOVERY
  const media = item.mediaResolved
  const warm = tone !== 'dark'
  const distance = formatDistance(item.distanceM)
  const meta = [distance, formatDuration(item.timeCostMin)].filter(Boolean).join(' · ')
          const chipBg = item.locked
            ? R.cardWarm
            : discovery
              ? `color-mix(in srgb, ${R.teal} 18%, ${R.cardWarm})`
              : item.mysteryEligible
                ? `color-mix(in srgb, ${R.violet} 16%, ${R.cardWarm})`
                : `color-mix(in srgb, ${R.gold} 22%, ${R.cardWarm})`
          const photoH = compact || horizontal ? 88 : primary ? 168 : discovery ? 110 : 128
          const titleSize = compact || horizontal ? 16 : primary ? 22 : discovery ? 17 : 20
          const kind = item.locked
            ? coverageLabel || t('native.content.locked')
            : discovery
              ? t('native.content.eyebrow.notice')
              : t('native.content.eyebrow.experience')

  const body = (
    <>
      <PlaceMedia item={item} height={photoH} radius={0} />
      <div style={{ padding: compact || horizontal ? '10px 12px 12px' : primary ? '14px 14px 12px' : '12px 14px 12px' }}>
        {(compact || horizontal) && !item.locked ? null : (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
            <span
              style={{
                padding: '3px 7px',
                borderRadius: 999,
                background: chipBg,
                color: R.ink,
                fontFamily: F.body,
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                border: `1px solid ${R.line}`,
              }}
            >
              {kind}
            </span>
          </div>
        )}
        <h2
          style={{
            margin: 0,
            fontFamily: F.display,
            fontSize: titleSize,
            fontWeight: 400,
            lineHeight: 1.2,
            color: R.ink,
          }}
        >
          {item.title}
        </h2>
        {compact || horizontal ? null : (
          <p
            style={{
              margin: '6px 0 0',
              color: R.muted,
              fontSize: 14,
              lineHeight: 1.4,
              fontFamily: F.body,
            }}
          >
            {item.whyWorthIt}
          </p>
        )}
        <p style={{ margin: '8px 0 0', color: R.muted, fontSize: 12, fontFamily: F.body }}>{meta}</p>
        {showViewCue ? (
          <p style={{ margin: '8px 0 0', color: T.actVI, fontSize: 12, fontFamily: F.body, fontWeight: 600 }}>
            {t('native.discover.view')}
          </p>
        ) : null}
      </div>
    </>
  )

  return (
    <article
      data-testid={testId}
      data-content-type={item.contentType}
      data-asset-source={import.meta.env.DEV ? media?.source : undefined}
      style={{
        borderRadius: primary ? 20 : 14,
        overflow: 'hidden',
        background: R.cardFill,
        border: `1px solid ${R.line}`,
        boxShadow: primary ? R.shadow : 'none',
        marginBottom: compact || horizontal ? 0 : primary ? 12 : 10,
        minWidth: horizontal ? 168 : undefined,
        maxWidth: horizontal ? 200 : undefined,
        flex: horizontal ? '0 0 176px' : undefined,
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
          color: R.ink,
        }}
      >
        {body}
      </button>
    </article>
  )
}
