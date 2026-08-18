import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { contentRoute, getRomeRankableCatalog } from '../../content/rome/registry.js'
import { canAccessContentId } from '../../lib/contentAccess.js'
import { readGuestContext, writeGuestLocation } from '../../lib/guestSession.js'
import { getLocationFix, LOCATION_STATUS } from '../../lib/locationAccess.js'
import { startHeroExperience } from '../../lib/heroExperience.js'
import { discoverCards, rankHeroes } from '../../lib/rankHeroes.js'
import { track, TRACK_EVENTS } from '../../lib/track.js'
import { getJourneySnapshot } from '../../state/journey.js'
import { CONTENT_TYPES } from '../../content/registry/constants.js'
import { COVERAGE_LABELS } from '../../content/rome/heroRecommendationMeta.js'
import { useT } from '../../i18n/I18nProvider.jsx'
import { F, T } from '../tokens.js'
import { GhostButton } from '../ui/GhostButton.jsx'
import { PrimaryButton } from '../ui/PrimaryButton.jsx'
import NativeContentCard from '../ui/NativeContentCard.jsx'
import NativeCoverageSheet from '../ui/NativeCoverageSheet.jsx'

function coverageLabelFor(item) {
  if (!item.locked) return null
  const paid = (item.unlockScopes || []).find((scope) => scope !== 'rome-free')
  return COVERAGE_LABELS[paid] || 'Locked'
}

export default function NativeDiscoverHome() {
  const t = useT()
  const navigate = useNavigate()
  const guest = readGuestContext()
  const [position, setPosition] = useState(guest.lastPosition)
  const [lockItem, setLockItem] = useState(null)
  const impressed = useRef(false)

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
        position,
        canAccess: (id) => canAccessContentId(id),
        completedIds,
      }),
    [catalog, completedIds, guest, position],
  )

  const { primary, alternatives } = discoverCards(ranked)

  useEffect(() => {
    track(TRACK_EVENTS.DISCOVER_VIEWED, { city: 'rome' })
  }, [])

  useEffect(() => {
    if (impressed.current || !primary) return
    impressed.current = true
    track(TRACK_EVENTS.RECOMMENDATION_IMPRESSION, {
      primary: primary.id,
      alternatives: alternatives.map((item) => item.id),
    })
  }, [alternatives, primary])

  useEffect(() => {
    let cancelled = false
    void getLocationFix({ timeoutMs: 8000 }).then((result) => {
      if (cancelled) return
      if (result.status === LOCATION_STATUS.SUCCESS && result.position) {
        setPosition(result.position)
        writeGuestLocation(result.position, 'granted')
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const openItem = (item) => {
    track(TRACK_EVENTS.RECOMMENDATION_OPENED, { content_id: item.id, locked: item.locked })
    navigate(contentRoute(item))
  }

  const startItem = (item) => {
    if (item.contentType === CONTENT_TYPES.DISCOVERY) {
      if (item.locked) {
        setLockItem(item)
        return
      }
      navigate(contentRoute(item))
      return
    }
    const result = startHeroExperience(item.heroId || item.id, { navigate })
    if (!result.ok && result.reason === 'locked') setLockItem(item)
  }

  return (
    <div
      data-testid="native-discover"
      style={{
        minHeight: '100%',
        background: T.obsidian,
        color: T.bone,
        padding:
          'max(20px, calc(env(safe-area-inset-top) + 12px)) 20px calc(var(--shell-tab-bar-height, 72px) + 12px)',
        boxSizing: 'border-box',
      }}
    >
      <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.muted }}>
        ChronoWalk · Rome
      </p>
      <p style={{ margin: '8px 0 0', color: 'rgba(250,246,239,0.7)', fontSize: 14 }}>
        {position ? t('native.discover.status.located') : t('native.discover.status.browse')}
      </p>
      <h1 style={{ fontFamily: F.display, fontWeight: 400, fontSize: 30, margin: '18px 0 18px', lineHeight: 1.15 }}>
        {t('native.discover.headline')}
      </h1>

      {primary ? (
        <>
          <NativeContentCard
            item={primary}
            primary
            testId="discover-primary-card"
            coverageLabel={coverageLabelFor(primary)}
            onOpen={openItem}
          />
          <div style={{ padding: '0 0 16px', display: 'flex', flexDirection: 'column', gap: 8, marginTop: -8 }}>
            <PrimaryButton color={T.gold} data-testid="discover-start" onClick={() => startItem(primary)} style={{ minHeight: 48 }}>
              {primary.locked || primary.contentType === CONTENT_TYPES.DISCOVERY
                ? t('native.discover.view')
                : t('native.discover.start')}
            </PrimaryButton>
            <GhostButton data-testid="discover-view" onClick={() => openItem(primary)} style={{ minHeight: 44 }}>
              {t('native.discover.view')}
            </GhostButton>
          </div>
        </>
      ) : null}
      {alternatives.map((item) => (
        <NativeContentCard
          key={item.id}
          item={item}
          testId={`discover-alt-card-${item.id}`}
          coverageLabel={coverageLabelFor(item)}
          onOpen={openItem}
        />
      ))}

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <GhostButton data-testid="discover-see-all" onClick={() => navigate('/explore')} style={{ minHeight: 48 }}>
          {t('native.discover.seeAll')}
        </GhostButton>
        <GhostButton data-testid="discover-map" onClick={() => navigate('/map')} style={{ minHeight: 48 }}>
          {t('native.discover.map')}
        </GhostButton>
      </div>

      <NativeCoverageSheet open={Boolean(lockItem)} item={lockItem} onClose={() => setLockItem(null)} />
    </div>
  )
}
