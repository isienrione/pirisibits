import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { contentRoute, getRomeRankableCatalog } from '../../content/rome/registry.js'
import { buildExploreSections } from '../../content/rome/exploreSections.js'
import { canAccessContentId } from '../../lib/contentAccess.js'
import { readGuestContext } from '../../lib/guestSession.js'
import { rankHeroes } from '../../lib/rankHeroes.js'
import { getJourneySnapshot } from '../../state/journey.js'
import { F, T } from '../tokens.js'
import { useT } from '../../i18n/I18nProvider.jsx'
import NativeContentCard from '../ui/NativeContentCard.jsx'

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
        position: guest.lastPosition,
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
        position: guest.lastPosition,
        availableTimeNow: guest.session?.availableTimeNow || guest.timeBudgetId,
        completedIds,
      }),
    [catalog, completedIds, guest.lastPosition, guest.session?.availableTimeNow, guest.timeBudgetId, ranked.ranked],
  )

  return (
    <div
      data-testid="native-explore"
      style={{
        minHeight: '100%',
        background: T.obsidian,
        color: T.bone,
        padding:
          'max(20px, calc(env(safe-area-inset-top) + 12px)) 20px calc(var(--shell-tab-bar-height, 72px) + 12px)',
      }}
    >
      <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.muted }}>
        ChronoWalk · Rome
      </p>
      <h1 style={{ fontFamily: F.display, fontWeight: 400, fontSize: 30, margin: '12px 0 8px' }}>
        {t('native.explore.title')}
      </h1>
      <p style={{ margin: '0 0 18px', color: T.muted, lineHeight: 1.45 }}>{t('native.explore.body')}</p>
      {sections.map((section) => (
        <section key={section.id} data-testid={`explore-section-${section.id}`} style={{ marginBottom: 28 }}>
          <h2
            style={{
              margin: '0 0 12px',
              fontFamily: F.body,
              fontSize: 12,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: T.muted,
            }}
          >
            {section.title}
          </h2>
          {section.items.slice(0, 6).map((item) => (
            <NativeContentCard
              key={`${section.id}-${item.id}`}
              item={item}
              testId={`explore-item-${item.id}`}
              onOpen={(next) => navigate(contentRoute(next))}
            />
          ))}
        </section>
      ))}
    </div>
  )
}
