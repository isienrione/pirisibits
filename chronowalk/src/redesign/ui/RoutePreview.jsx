import { CONTENT_TYPES } from '../../content/registry/constants.js'
import { isMysteryHidden } from '../../lib/route/model.js'
import { canAccessContentId } from '../../lib/contentAccess.js'
import { F } from '../tokens.js'
import { R, routeType } from './RouteSurface.jsx'
import PlaceMedia from './PlaceMedia.jsx'

export default function RoutePreview({
  items = [],
  catalogById = {},
  currentId = null,
  compact = false,
}) {
  return (
    <ol data-testid="route-timeline" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {items.map((item, index) => {
        const content = catalogById[item.contentId]
        const mystery = isMysteryHidden(item)
        const title = mystery ? 'Surprise Discovery' : content?.shortTitle || content?.title || item.contentId
        const discovery = item.contentType === CONTENT_TYPES.DISCOVERY
        const current = item.routeItemId === currentId
        const done = item.state === 'completed'
        const locked = Boolean(content && !canAccessContentId(item.contentId))
        const thumbH = compact ? 56 : current ? 92 : 72
        return (
          <li
            key={item.routeItemId}
            data-testid={`route-item-${item.contentId}`}
            data-mystery={mystery ? 'true' : 'false'}
            data-state={item.state || 'upcoming'}
            style={{ marginBottom: compact ? 8 : 10 }}
          >
            {index > 0 ? (
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
                ↓ {item.estimatedTransitMin ? `${item.estimatedTransitMin} min walk` : 'a short walk'}
              </p>
            ) : null}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `${compact ? 64 : 88}px 1fr`,
                gap: 12,
                alignItems: 'center',
                padding: compact ? 8 : 10,
                borderRadius: 16,
                border: `1px solid ${current ? R.gold : R.line}`,
                background: done
                  ? `color-mix(in srgb, ${R.teal} 10%, ${R.cardWarm})`
                  : current
                    ? R.cardFill
                    : mystery
                      ? `linear-gradient(165deg, color-mix(in srgb, ${R.violet} 10%, ${R.cardWarm}) 0%, ${R.cardWarm} 100%)`
                      : R.cardWarm,
                boxShadow: current ? R.shadow : 'none',
                opacity: locked && !current && !done ? 0.78 : 1,
              }}
            >
              <PlaceMedia item={content} mystery={mystery} height={thumbH} radius={12} />
              <div>
                <p style={{ ...routeType, color: mystery ? R.violet : done ? R.teal : R.muted }}>
                  {done ? 'Done' : current ? 'Now' : mystery ? 'Surprise' : discovery ? 'Worth noticing' : 'Experience'}
                  {locked ? ' · Locked' : ''}
                </p>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontFamily: F.display,
                    fontSize: compact ? 16 : 18,
                    fontWeight: 400,
                    color: R.ink,
                    lineHeight: 1.2,
                  }}
                >
                  {mystery ? '✦ Surprise Discovery' : title}
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
