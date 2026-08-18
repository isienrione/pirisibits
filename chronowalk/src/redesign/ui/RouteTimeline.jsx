import { CONTENT_TYPES } from '../../content/registry/constants.js'
import { F } from '../tokens.js'
import { isMysteryHidden } from '../../lib/route/model.js'
import { canAccessContentId } from '../../lib/contentAccess.js'
import { R, routeType } from './RouteSurface.jsx'

function stopDot({ done, current, mystery, locked }) {
  if (done) {
    return {
      background: R.teal,
      border: `1.5px solid ${R.teal}`,
      boxShadow: 'none',
    }
  }
  if (current) {
    return {
      background: R.gold,
      border: `1.5px solid ${R.gold}`,
      boxShadow: '0 0 0 6px rgba(212,175,55,0.22)',
    }
  }
  if (mystery) {
    return {
      background: R.violet,
      border: `1.5px solid ${R.gold}`,
      boxShadow: `0 0 0 4px color-mix(in srgb, ${R.violet} 22%, transparent)`,
    }
  }
  if (locked) {
    return {
      background: R.cardWarm,
      border: `1.5px solid ${R.olive}`,
      boxShadow: 'none',
    }
  }
  return {
    background: R.cardWarm,
    border: `1.5px solid ${R.line}`,
    boxShadow: 'none',
  }
}

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
        const locked = Boolean(content && !canAccessContentId(item.contentId))
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
              opacity: item.state === 'removed' ? 0.4 : locked && !current && !done ? 0.78 : 1,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 12,
                height: 12,
                marginTop: 6,
                borderRadius: '50%',
                boxSizing: 'border-box',
                ...stopDot({ done, current, mystery, locked }),
              }}
            />
            <div>
              <p style={routeType}>
                {done ? 'Done' : current ? 'Now' : `${index + 1}`}
                {' · '}
                {mystery ? 'Surprise' : discovery ? 'Worth noticing' : 'Experience'}
                {locked ? ' · Locked' : ''}
              </p>
              <p style={{ margin: '4px 0 0', fontFamily: F.display, fontSize: compact ? 18 : 22, fontWeight: 400, color: R.ink }}>
                {mystery ? '✦ Surprise Discovery' : title}
              </p>
              <p style={{ margin: '4px 0 0', color: R.muted, fontSize: 13, fontFamily: F.body }}>
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
