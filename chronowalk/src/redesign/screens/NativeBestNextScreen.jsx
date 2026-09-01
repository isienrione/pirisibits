import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getRomeRankableCatalog, contentRoute } from '../../content/rome/registry.js'
import { canAccessContentId } from '../../lib/contentAccess.js'
import { readGuestContext } from '../../lib/guestSession.js'
import { bestNext, discoverCards } from '../../lib/rankHeroes.js'
import { getJourneySnapshot } from '../../state/journey.js'
import {
  bifurcationOptions,
  currentRouteItem,
  isMysteryHidden,
  isRouteLive,
  replaceCurrentWith,
  ROUTE_MUTATION_REASONS,
  trackBifurcationView,
} from '../../lib/route/index.js'
import { useRouteState } from '../../lib/route/useRouteState.js'
import { useT } from '../../i18n/I18nProvider.jsx'
import { F, T } from '../tokens.js'
import NativePageHeader from '../ui/NativePageHeader.jsx'
import NativeContentCard from '../ui/NativeContentCard.jsx'
import { GhostButton } from '../ui/GhostButton.jsx'
import { PrimaryButton } from '../ui/PrimaryButton.jsx'
import MysteryCard from '../ui/MysteryCard.jsx'
import PlaceMedia from '../ui/PlaceMedia.jsx'
import {
  R,
  RouteSurface,
  routeCard,
  routeGhost,
  routeHeadline,
  routeOverlay,
  routePrimary,
  routeSheet,
  routeType,
} from '../ui/RouteSurface.jsx'

function OptionRow({ option, testId, onChoose, variant = 'alt' }) {
  if (!option) return null
  const mystery = option.isMystery
  const recommended = variant === 'recommended'
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={() => onChoose(option)}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        ...routeCard,
        padding: recommended ? 16 : 12,
        marginBottom: 10,
        borderRadius: recommended ? 20 : 16,
        border: `1px solid ${R.line}`,
        borderLeft: recommended && !mystery ? `3px solid ${R.gold}` : `1px solid ${R.line}`,
        background: mystery
          ? `linear-gradient(165deg, color-mix(in srgb, ${R.sage} 16%, ${R.bg}) 0%, color-mix(in srgb, ${R.violet} 10%, ${R.cardWarm}) 100%)`
          : recommended
            ? R.cardFill
            : R.cardWarm,
        boxShadow: recommended ? R.shadow : 'none',
        color: R.ink,
      }}
    >
      <PlaceMedia item={option.item} mystery={mystery} height={recommended ? 120 : 64} radius={14} />
      <p style={{ ...routeType, color: mystery ? R.violet : R.muted, marginTop: 10 }}>
        {mystery ? '✦' : recommended ? 'Recommended' : ''}
      </p>
      <p style={{ fontFamily: F.display, fontSize: recommended ? 22 : 16, margin: '6px 0 4px', color: R.ink }}>
        {mystery ? '✦ A hidden detail' : option.item?.title}
      </p>
      <p style={{ margin: '8px 0 0', color: R.muted, fontSize: 13, fontFamily: F.body }}>
        {option.walkMin != null ? `${option.walkMin} min walk · ` : ''}
        {option.experienceMin} min
      </p>
      {recommended ? (
        <p style={{ margin: '8px 0 0', lineHeight: 1.4, fontFamily: F.body, color: R.ink }}>{option.reason}</p>
      ) : null}
    </button>
  )
}

export default function NativeBestNextScreen() {
  const t = useT()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const exclude = params.get('exclude')
  const guest = readGuestContext()
  const { active } = useRouteState()
  const catalog = useMemo(() => getRomeRankableCatalog(), [])
  const [compare, setCompare] = useState(false)
  const live = isRouteLive(active)

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

  const options = useMemo(
    () => (live ? bifurcationOptions({ active, catalog, context: guest, position: guest.lastPosition }) : null),
    [live, active, catalog, guest],
  )

  useEffect(() => {
    if (live && options) trackBifurcationView(active, options)
  }, [live, active?.currentRouteItemId])

  const goWith = (option) => {
    if (!option?.item) return
    const current = currentRouteItem(active)
    if (current && option.contentId === current.contentId) {
      if (isMysteryHidden(current)) navigate(`/mystery/${current.routeItemId}`)
      else navigate('/walk')
      return
    }
    const next = replaceCurrentWith(option.item, {
      reason: option.isMystery ? ROUTE_MUTATION_REASONS.SURPRISE_CHOICE : ROUTE_MUTATION_REASONS.USER_ALTERNATIVE,
    })
    const replaced = currentRouteItem(next)
    if (replaced && isMysteryHidden(replaced)) {
      navigate(`/mystery/${replaced.routeItemId}`)
      return
    }
    navigate('/walk')
  }

  const stayOnPlan = () => {
    const current = currentRouteItem(active)
    if (current && isMysteryHidden(current)) {
      navigate(`/mystery/${current.routeItemId}`)
      return
    }
    navigate('/walk')
  }

  if (live && options) {
    const compareList = [options.recommended, ...(options.alternatives || [])].filter(Boolean).slice(0, 3)
    return (
      <RouteSurface testId="native-best-next" header={<NativePageHeader backTo="/route" />}>
        <div data-testid="native-bifurcation">
          <p style={routeType}>{t('native.next.where')}</p>
          <h1 style={routeHeadline}>{t('native.next.whereTitle')}</h1>
          <p style={{ ...routeType, margin: '0 0 8px' }}>
            {t('native.next.recommended')}
          </p>
          {options.recommended?.isMystery ? (
            <MysteryCard
              item={{ isMysteryDiscovery: true }}
              content={null}
              flipped={false}
              walkMin={options.recommended.walkMin}
              experienceMin={options.recommended.experienceMin}
              onTake={() => goWith(options.recommended)}
              onReveal={() => goWith(options.recommended)}
            />
          ) : (
            <OptionRow option={options.recommended} testId="bifurcation-recommended" variant="recommended" onChoose={goWith} />
          )}
          {(options.alternatives || []).slice(0, 2).map((option, index) => (
            <OptionRow
              key={option.contentId}
              option={option}
              testId={`bifurcation-alt-${index}`}
              variant={option.isMystery ? 'mystery' : 'alt'}
              onChoose={goWith}
            />
          ))}
          <PrimaryButton color={T.gold} data-testid="bifurcation-stay" onClick={stayOnPlan} style={{ ...routePrimary, marginTop: 8 }}>
            {t('native.next.stay')}
          </PrimaryButton>
          <GhostButton
            data-testid="bifurcation-compare"
            onClick={() => setCompare(true)}
            style={{ ...routeGhost, marginTop: 10 }}
          >
            {t('native.next.compare')}
          </GhostButton>
        </div>
        {compare ? (
          <div data-testid="compare-options-sheet" role="dialog" aria-modal="true" style={routeOverlay}>
            <button type="button" aria-label="Close" onClick={() => setCompare(false)} style={{ position: 'absolute', inset: 0, border: 'none', background: 'transparent' }} />
            <div style={routeSheet}>
              <p style={routeType}>{t('native.next.compare')}</p>
              <h2 style={{ ...routeHeadline, fontSize: 26, margin: '8px 0 12px' }}>
                {t('native.next.compareTitle')}
              </h2>
              {compareList.map((option, index) => (
                <OptionRow
                  key={option.contentId}
                  option={option}
                  testId={`compare-option-${index}`}
                  variant={index === 0 ? 'recommended' : option.isMystery ? 'mystery' : 'alt'}
                  onChoose={(picked) => {
                    setCompare(false)
                    goWith(picked)
                  }}
                />
              ))}
              <GhostButton
                data-testid="compare-close"
                onClick={() => setCompare(false)}
                style={routeGhost}
              >
                {t('native.route.done')}
              </GhostButton>
            </div>
          </div>
        ) : null}
      </RouteSurface>
    )
  }

  return (
    <RouteSurface testId="native-best-next" header={<NativePageHeader backTo="/home" />}>
      <p style={routeType}>
        {t('native.next.whats')}
      </p>
      <h1 style={routeHeadline}>
        {t('native.next.best')}
      </h1>
      {primary ? (
        <NativeContentCard
          item={primary}
          primary
          tone="warm"
          testId="best-next-primary"
          onOpen={(item) => navigate(contentRoute(item))}
        />
      ) : null}
      {alternatives.slice(0, 2).map((item) => (
        <NativeContentCard
          key={item.id}
          item={item}
          compact
          tone="warm"
          testId={`best-next-alt-${item.id}`}
          onOpen={(next) => navigate(contentRoute(next))}
        />
      ))}
      <GhostButton data-testid="best-next-home" onClick={() => navigate('/route')} style={{ ...routeGhost, marginTop: 8 }}>
        {t('native.next.seeRoute')}
      </GhostButton>
    </RouteSurface>
  )
}
