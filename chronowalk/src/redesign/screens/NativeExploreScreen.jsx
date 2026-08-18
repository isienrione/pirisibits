import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { contentRoute, getRomeRankableCatalog } from '../../content/rome/registry.js'
import { buildExploreSections } from '../../content/rome/exploreSections.js'
import { canAccessContentId } from '../../lib/contentAccess.js'
import { readGuestContext } from '../../lib/guestSession.js'
import { rankHeroes } from '../../lib/rankHeroes.js'
import { getJourneySnapshot } from '../../state/journey.js'
import { F } from '../tokens.js'
import { useT } from '../../i18n/I18nProvider.jsx'
import NativeContentCard from '../ui/NativeContentCard.jsx'
import { isPlausibleRomePosition } from '../../lib/geoSanity.js'
import { R, RouteSurface, routeType } from '../ui/RouteSurface.jsx'

export default function NativeExploreScreen() {
  const t = useT()
  const navigate = useNavigate()
  const guest = readGuestContext()
  const catalog = useMemo(() => getRomeRankableCatalog(), [])
  const completedIds = [
    ...(getJourneySnapshot()?.context?.completedWaypointIds ?? []),
    ...(guest.history?.completedExperienceIds ?? []),
  ]
  const ranked = useMemo(
    () =>
      rankHeroes({
        catalog,
        context: guest,
        position: isPlausibleRomePosition(guest.lastPosition) ? guest.lastPosition : null,
        canAccess: (id) => canAccessContentId(id),
        completedIds,
      }),
    [catalog, completedIds, guest],
  )
  const sections = useMemo(
    () =>
      buildExploreSections({
        catalog: ranked.ranked,
        ranked: ranked.ranked,
        position: isPlausibleRomePosition(guest.lastPosition) ? guest.lastPosition : null,
        availableTimeNow: guest.session?.availableTimeNow || guest.timeBudgetId,
        completedIds,
      }),
    [catalog, completedIds, guest.lastPosition, guest.session?.availableTimeNow, guest.timeBudgetId, ranked.ranked],
  )

  return (
    <RouteSurface testId="native-explore">
      <p style={routeType}>ChronoWalk · Rome</p>
      <h1 style={{ fontFamily: F.display, fontWeight: 400, fontSize: 30, margin: '12px 0 8px', color: R.ink }}>
        {t('native.explore.title')}
      </h1>
      <p style={{ margin: '0 0 18px', color: R.muted, lineHeight: 1.45, fontFamily: F.body }}>{t('native.explore.body')}</p>
      {sections.map((section) => (
        <section key={section.id} data-testid={`explore-section-${section.id}`} style={{ marginBottom: 28 }}>
          <h2
            style={{
              margin: '0 0 12px',
              fontFamily: F.body,
              fontSize: 12,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: R.muted,
            }}
          >
            {section.title}
          </h2>
          {section.items.slice(0, 6).map((item) => (
            <NativeContentCard
              key={`${section.id}-${item.id}`}
              item={item}
              compact
              testId={`explore-item-${item.id}`}
              onOpen={(next) => navigate(contentRoute(next))}
            />
          ))}
        </section>
      ))}
    </RouteSurface>
  )
}
