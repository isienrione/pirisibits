import { CONTENT_TYPES } from '../../content/registry/constants.js'
import { F } from '../tokens.js'
import { isMysteryHidden } from '../../lib/route/model.js'
import { canAccessContentId } from '../../lib/contentAccess.js'
import { R, routeType } from './RouteSurface.jsx'

export default function RouteTimeline({
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
        return (
          <li
            key={item.routeItemId}
            data-testid={`route-item-${item.contentId}`}
            data-mystery={mystery ? 'true' : 'false'}
            data-state={item.state}
            style={{
              display: 'grid',
              gridTemplateColumns: '20px 1fr',
              gap: 12,
              marginBottom: compact ? 10 : 14,
              opacity: item.state === 'removed' ? 0.4 : 1,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 12,
                height: 12,
                marginTop: 6,
                borderRadius: '50%',
                background: done ? R.teal : current ? R.gold : mystery ? R.sage : discovery ? R.ink : R.gold,
                boxShadow: current ? `0 0 0 6px rgba(212,175,55,0.22)` : 'none',
              }}
            />
            <div>
              <p style={routeType}>
                {done ? 'Done' : current ? 'Now' : `${index + 1}`}
                {' · '}
                {mystery ? 'Surprise' : discovery ? 'Worth noticing' : 'Experience'}
                {content && !canAccessContentId(item.contentId) ? ' · Locked' : ''}
              </p>
              <p style={{ margin: '4px 0 0', fontFamily: F.display, fontSize: compact ? 18 : 22, fontWeight: 400 }}>
                {mystery ? '✦ Surprise Discovery' : title}
              </p>
              <p style={{ margin: '4px 0 0', color: R.muted, fontSize: 13 }}>
                {item.estimatedTransitMin ? `${item.estimatedTransitMin} min walk · ` : ''}
                {item.estimatedExperienceMin} min
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
