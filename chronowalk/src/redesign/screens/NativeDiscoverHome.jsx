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
import { isPlausibleRomePosition } from '../../lib/geoSanity.js'
import {
  ensureProposedRoute,
  estimateRouteTotals,
  formatDurationLabel,
  isRouteLive,
  liveItems,
  resumeRoute,
  startRoute,
} from '../../lib/route/index.js'
import { useRouteState } from '../../lib/route/useRouteState.js'
import { useT } from '../../i18n/I18nProvider.jsx'
import { F, T } from '../tokens.js'
import { GhostButton } from '../ui/GhostButton.jsx'
import { PrimaryButton } from '../ui/PrimaryButton.jsx'
import NativeContentCard from '../ui/NativeContentCard.jsx'
import NativeCoverageSheet from '../ui/NativeCoverageSheet.jsx'
import RoutePreview from '../ui/RoutePreview.jsx'
import PlaceMedia from '../ui/PlaceMedia.jsx'
import { isMysteryHidden } from '../../lib/route/model.js'
import { R, RouteSurface, routeGhost, routePrimary, routeType } from '../ui/RouteSurface.jsx'

function coverageLabelFor(item) {
  if (!item.locked) return null
  const paid = (item.unlockScopes || []).find((scope) => scope !== 'rome-free')
  return COVERAGE_LABELS[paid] || 'Locked'
}

export default function NativeDiscoverHome() {
  const t = useT()
  const navigate = useNavigate()
  const guest = readGuestContext()
  const { proposed, active } = useRouteState()
  const [position, setPosition] = useState(guest.lastPosition)
  const [lockItem, setLockItem] = useState(null)
  const impressed = useRef(false)

  const catalog = useMemo(() => getRomeRankableCatalog(), [])
  const byId = useMemo(() => Object.fromEntries(catalog.map((item) => [item.id, item])), [catalog])
  const completedIds = [
    ...(getJourneySnapshot()?.context?.completedWaypointIds ?? []),
    ...(guest.history?.completedExperienceIds ?? []),
  ]

  const located = isPlausibleRomePosition(position)
  const plan = useMemo(() => {
    if (isRouteLive(active)) return active
    return (
      proposed ||
      ensureProposedRoute({
        context: guest,
        catalog,
        position: located ? position : null,
        canAccess: canAccessContentId,
      })
    )
  }, [active, proposed, catalog, guest, located, position])

  const ranked = useMemo(
    () =>
      rankHeroes({
        catalog,
        context: guest,
        position: located ? position : null,
        canAccess: (id) => canAccessContentId(id),
        completedIds,
      }),
    [catalog, completedIds, guest, located, position],
  )

  const onRoute = new Set(liveItems(plan).map((item) => item.contentId))
  const nearby = (ranked.ranked || []).filter((item) => !onRoute.has(item.id)).slice(0, 4)
  const { primary, alternatives } = nearby.length
    ? { primary: nearby[0], alternatives: nearby.slice(1, 4) }
    : discoverCards(ranked)

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

  const paused = active?.status === 'paused'
  const live = isRouteLive(active)
  const totals = plan?.items ? estimateRouteTotals(plan.items) : null
  const durationLabel = formatDurationLabel(totals?.estimatedDurationMin || plan?.estimatedDurationMin)
  const homeHeadline = proposed?.homeHeadline || plan?.homeHeadline
  const locationCopy = located
    ? t('native.discover.status.located')
    : guest.locationStatus === 'denied' || guest.locationStatus === 'skipped'
      ? t('native.discover.status.browse')
      : t('native.discover.status.turnOn')
  const firstVisible = liveItems(plan)
    .map((item) => (isMysteryHidden(item) ? null : byId[item.contentId]))
    .find(Boolean)

  return (
    <RouteSurface testId="native-discover">
      <p style={routeType}>ChronoWalk · Rome</p>
      <p style={{ margin: '8px 0 0', color: R.muted, fontSize: 14, fontFamily: F.body }}>{locationCopy}</p>

      {plan?.items?.length ? (
        <div
          data-testid="discover-route-card"
          data-resume={paused ? 'true' : 'false'}
          style={{
            margin: '16px 0 18px',
            padding: 14,
            borderRadius: 22,
            background: R.cardFill,
            border: `1px solid ${R.line}`,
            borderLeft: `3px solid ${R.gold}`,
            boxShadow: R.shadow,
          }}
        >
          {firstVisible ? <PlaceMedia item={firstVisible} height={132} radius={16} /> : null}
          <p style={{ ...routeType, marginTop: 12 }}>
            {paused ? t('native.route.pausedEyebrow') : t('native.route.based')}
          </p>
          <h1 style={{ fontFamily: F.display, fontWeight: 400, fontSize: 24, margin: '8px 0 10px', lineHeight: 1.15, color: R.ink }}>
            {paused
              ? t('native.route.continueAfternoon')
              : homeHeadline || t('native.route.homeHeadline', { duration: durationLabel.replace(/^~/, '') })}
          </h1>
          <RoutePreview items={liveItems(plan)} catalogById={byId} compact currentId={active?.currentRouteItemId} />
          <PrimaryButton
            color={T.gold}
            data-testid={paused ? 'discover-resume' : 'discover-start-route'}
            onClick={() => {
              if (paused) resumeRoute({ position })
              else if (!live) startRoute(plan)
              navigate('/route')
            }}
            style={{ marginTop: 12, ...routePrimary }}
          >
            {paused ? t('native.route.continueAfternoon') : t('native.discover.startExploring')}
          </PrimaryButton>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <GhostButton
              data-testid="discover-see-route"
              onClick={() => navigate(live ? '/route' : '/plan')}
              style={routeGhost}
            >
              {t('native.discover.seeRoute')}
            </GhostButton>
            <GhostButton data-testid="discover-adjust" onClick={() => navigate('/route/adjust')} style={routeGhost}>
              {t('native.route.adjust')}
            </GhostButton>
          </div>
        </div>
      ) : (
        <h1 style={{ fontFamily: F.display, fontWeight: 400, fontSize: 30, margin: '18px 0 18px', lineHeight: 1.15, color: R.ink }}>
          {t('native.discover.headline')}
        </h1>
      )}

      <p
        data-testid="discover-nearby-heading"
        style={{ ...routeType, margin: '0 0 12px', fontSize: 12, letterSpacing: '0.18em' }}
      >
        {t('native.discover.orNearby')}
      </p>
      <div
        data-testid="discover-nearby-row"
        style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8, marginBottom: 12 }}
      >
        {primary ? (
          <NativeContentCard
            item={primary}
            compact
            horizontal
            testId="discover-primary-card"
            coverageLabel={coverageLabelFor(primary)}
            onOpen={(item) => {
              if (item.contentType === CONTENT_TYPES.HERO && !item.locked) startItem(item)
              else openItem(item)
            }}
          />
        ) : null}
        {alternatives.map((item) => (
          <NativeContentCard
            key={item.id}
            item={item}
            compact
            horizontal
            testId={`discover-alt-card-${item.id}`}
            coverageLabel={coverageLabelFor(item)}
            onOpen={openItem}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <GhostButton data-testid="discover-see-all" onClick={() => navigate('/explore')} style={routeGhost}>
          {t('native.discover.seeAll')}
        </GhostButton>
        <GhostButton data-testid="discover-map" onClick={() => navigate('/map')} style={routeGhost}>
          {t('native.discover.map')}
        </GhostButton>
      </div>

      <NativeCoverageSheet open={Boolean(lockItem)} item={lockItem} onClose={() => setLockItem(null)} />
    </RouteSurface>
  )
}
