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
import NativeContentCard from '../ui/NativeContentCard.jsx'
import { GhostButton } from '../ui/GhostButton.jsx'
import { PrimaryButton } from '../ui/PrimaryButton.jsx'
import MysteryCard from '../ui/MysteryCard.jsx'
import { R, RouteSurface, routeHeadline, routeType } from '../ui/RouteSurface.jsx'

function OptionRow({ option, testId, onChoose }) {
  if (!option) return null
  const mystery = option.isMystery
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={() => onChoose(option)}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        border: `1px solid ${R.line}`,
        background: R.card,
        borderRadius: 18,
        padding: 16,
        marginBottom: 10,
        color: R.ink,
      }}
    >
      <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: R.muted }}>
        {mystery ? 'Surprise Discovery' : option.item?.contentType === 'discovery' ? 'Worth noticing' : 'Experience'}
      </p>
      <p style={{ fontFamily: F.display, fontSize: 22, margin: '6px 0 4px' }}>
        {mystery ? '✦ Surprise Discovery' : option.item?.title}
      </p>
      <p style={{ margin: 0, color: R.muted, fontSize: 13 }}>
        {option.walkMin} min walk · {option.experienceMin} min
      </p>
      <p style={{ margin: '8px 0 0', lineHeight: 1.4 }}>{option.reason}</p>
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
      <RouteSurface testId="native-best-next">
        <div data-testid="native-bifurcation">
          <p style={routeType}>{t('native.next.where')}</p>
          <h1 style={routeHeadline}>{t('native.next.whereTitle')}</h1>
          <p style={{ margin: '0 0 8px', fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: R.muted }}>
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
            <OptionRow option={options.recommended} testId="bifurcation-recommended" onChoose={goWith} />
          )}
          {(options.alternatives || []).slice(0, 2).map((option, index) => (
            <OptionRow
              key={option.contentId}
              option={option}
              testId={`bifurcation-alt-${index}`}
              onChoose={goWith}
            />
          ))}
          <PrimaryButton color={T.gold} data-testid="bifurcation-stay" onClick={stayOnPlan} style={{ minHeight: 48, marginTop: 8 }}>
            {t('native.next.stay')}
          </PrimaryButton>
          <GhostButton
            data-testid="bifurcation-compare"
            onClick={() => setCompare(true)}
            style={{ minHeight: 48, marginTop: 10, color: R.ink, borderColor: R.line, background: 'transparent' }}
          >
            {t('native.next.compare')}
          </GhostButton>
        </div>
        {compare ? (
          <div data-testid="compare-options-sheet" role="dialog" aria-modal="true" style={overlay}>
            <button type="button" aria-label="Close" onClick={() => setCompare(false)} style={{ position: 'absolute', inset: 0, border: 'none', background: 'transparent' }} />
            <div style={sheet}>
              <p style={routeType}>{t('native.next.compare')}</p>
              <h2 style={{ fontFamily: F.display, fontWeight: 400, fontSize: 26, margin: '8px 0 12px' }}>
                {t('native.next.compareTitle')}
              </h2>
              {compareList.map((option, index) => (
                <OptionRow
                  key={option.contentId}
                  option={option}
                  testId={`compare-option-${index}`}
                  onChoose={(picked) => {
                    setCompare(false)
                    goWith(picked)
                  }}
                />
              ))}
              <GhostButton
                data-testid="compare-close"
                onClick={() => setCompare(false)}
                style={{ minHeight: 48, color: R.ink, borderColor: R.line, background: 'transparent' }}
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

const overlay = {
  position: 'fixed',
  inset: 0,
  zIndex: 130,
  background: 'rgba(26,26,31,0.28)',
  display: 'flex',
  alignItems: 'flex-end',
}

const sheet = {
  position: 'relative',
  width: '100%',
  maxHeight: '88dvh',
  overflowY: 'auto',
  background: R.bg,
  borderRadius: '24px 24px 0 0',
  padding: '22px 22px max(22px, calc(env(safe-area-inset-bottom) + 14px))',
  boxSizing: 'border-box',
}
