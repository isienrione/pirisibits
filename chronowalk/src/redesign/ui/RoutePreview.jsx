import { CONTENT_TYPES } from '../../content/registry/constants.js'
import { isMysteryHidden } from '../../lib/route/model.js'
import { canAccessContentId } from '../../lib/contentAccess.js'
import { useT } from '../../i18n/I18nProvider.jsx'
import { F } from '../tokens.js'
import { R, routeType } from './RouteSurface.jsx'
import PlaceMedia from './PlaceMedia.jsx'

function eyebrowFor({ mystery, done, current, locked }) {
  if (done) return 'Done'
  if (current) return 'Now'
  if (mystery) return '✦'
  if (locked) return 'Locked'
  return ''
}

export default function RoutePreview({
  items = [],
  catalogById = {},
  currentId = null,
  compact = false,
}) {
  const t = useT()
  return (
    <ol data-testid="route-timeline" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {items.map((item, index) => {
        const content = catalogById[item.contentId]
        const mystery = isMysteryHidden(item)
        const title = mystery ? `✦ ${t('native.route.mysteryFront')}` : content?.shortTitle || content?.title || item.contentId
        const discovery = item.contentType === CONTENT_TYPES.DISCOVERY
        const hero = !discovery && !mystery
        const current = item.routeItemId === currentId
        const done = item.state === 'completed'
        const locked = Boolean(content && !canAccessContentId(item.contentId))
        const thumbH = compact ? (hero ? 64 : 48) : hero ? (current ? 108 : 88) : current ? 72 : 58
        const walkMin = item.estimatedTransitMin
        const showLeg = index > 0 && item.legKind !== 'traveler' && Number(walkMin) > 0
        const brow = eyebrowFor({ mystery, done, current, locked })
        return (
          <li
            key={item.routeItemId}
            data-testid={`route-item-${item.contentId}`}
            data-mystery={mystery ? 'true' : 'false'}
            data-state={item.state || 'upcoming'}
            data-kind={mystery ? 'mystery' : discovery ? 'discovery' : 'experience'}
            style={{ marginBottom: compact ? 8 : 10 }}
          >
            {showLeg ? (
              <p
                data-testid={`route-walk-${item.contentId}`}
                style={{
                  margin: '0 0 8px',
                  textAlign: 'center',
                  color: R.teal,
                  fontFamily: F.body,
                  fontSize: 12,
                  letterSpacing: '0.04em',
                }}
              >
                ↓ {t('native.route.betweenStops', { minutes: walkMin })}
              </p>
            ) : index > 0 ? (
              <p style={{ margin: '0 0 8px', textAlign: 'center', color: R.teal, fontSize: 12 }}>↓</p>
            ) : null}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `${compact ? (hero ? 72 : 56) : hero ? 104 : 76}px 1fr`,
                gap: 12,
                alignItems: 'center',
                padding: compact ? 8 : hero ? 12 : 8,
                borderRadius: hero ? 18 : 14,
                border: `1px solid ${current ? R.gold : mystery ? R.violet : R.line}`,
                background: done
                  ? `color-mix(in srgb, ${R.teal} 10%, ${R.cardWarm})`
                  : current
                    ? R.cardFill
                    : mystery
                      ? `linear-gradient(165deg, color-mix(in srgb, ${R.violet} 10%, ${R.cardWarm}) 0%, ${R.cardWarm} 100%)`
                      : hero
                        ? R.cardFill
                        : R.cardWarm,
                boxShadow: current || hero ? R.shadow : 'none',
                opacity: locked && !current && !done ? 0.78 : 1,
              }}
            >
              <PlaceMedia item={content} mystery={mystery} height={thumbH} radius={12} />
              <div>
                {brow ? (
                  <p style={{ ...routeType, color: mystery ? R.violet : done ? R.teal : R.muted, fontSize: 10 }}>
                    {brow}
                  </p>
                ) : null}
                <p
                  style={{
                    margin: brow ? '4px 0 0' : 0,
                    fontFamily: F.display,
                    fontSize: compact ? (hero ? 17 : 15) : hero ? 20 : 16,
                    fontWeight: 400,
                    color: R.ink,
                    lineHeight: 1.2,
                  }}
                >
                  {title}
                </p>
                <p style={{ margin: '4px 0 0', color: R.muted, fontSize: 13, fontFamily: F.body }}>
                  {item.estimatedExperienceMin} min
                </p>
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
