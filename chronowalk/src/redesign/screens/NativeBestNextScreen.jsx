import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getRomeRankableCatalog, contentRoute } from '../../content/rome/registry.js'
import { canAccessContentId } from '../../lib/contentAccess.js'
import { readGuestContext } from '../../lib/guestSession.js'
import { bestNext, discoverCards } from '../../lib/rankHeroes.js'
import { getJourneySnapshot } from '../../state/journey.js'
import { useT } from '../../i18n/I18nProvider.jsx'
import { F, T } from '../tokens.js'
import NativeContentCard from '../ui/NativeContentCard.jsx'
import { GhostButton } from '../ui/GhostButton.jsx'

export default function NativeBestNextScreen() {
  const t = useT()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const exclude = params.get('exclude')
  const guest = readGuestContext()
  const catalog = useMemo(() => getRomeRankableCatalog(), [])
  const completedIds = [
    ...(getJourneySnapshot()?.context?.completedWaypointIds ?? []),
    ...(guest.history?.completedExperienceIds ?? []),
  ]

  const ranked = useMemo(
    () =>
      bestNext({
        catalog,
        context: guest,
        position: guest.lastPosition,
        canAccess: (id) => canAccessContentId(id),
        completedIds,
        excludeIds: [exclude],
      }),
    [catalog, completedIds, exclude, guest],
  )
  const { primary, alternatives } = discoverCards(ranked)

  return (
    <div
      data-testid="native-best-next"
      style={{
        minHeight: '100%',
        background: T.obsidian,
        color: T.bone,
        padding: 'max(20px, calc(env(safe-area-inset-top) + 12px)) 20px calc(var(--shell-tab-bar-height, 72px) + 12px)',
      }}
    >
      <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.muted }}>
        {t('native.next.eyebrow')}
      </p>
      <h1 style={{ fontFamily: F.display, fontWeight: 400, fontSize: 30, margin: '12px 0 18px' }}>
        {t('native.next.title')}
      </h1>
      {primary ? (
        <NativeContentCard
          item={primary}
          primary
          testId="best-next-primary"
          onOpen={(item) => navigate(contentRoute(item))}
        />
      ) : null}
      {alternatives.map((item) => (
        <NativeContentCard
          key={item.id}
          item={item}
          testId={`best-next-alt-${item.id}`}
          onOpen={(next) => navigate(contentRoute(next))}
        />
      ))}
      <GhostButton data-testid="best-next-home" onClick={() => navigate('/home')} style={{ minHeight: 48, marginTop: 8 }}>
        {t('native.discover.seeAll')}
      </GhostButton>
    </div>
  )
}
