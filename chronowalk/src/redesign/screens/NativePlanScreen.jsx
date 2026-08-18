import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRomeRankableCatalog } from '../../content/rome/registry.js'
import { canAccessContentId } from '../../lib/contentAccess.js'
import { readGuestContext } from '../../lib/guestSession.js'
import { composeAndSave, ensureProposedRoute } from '../../lib/route/index.js'
import { startRoute } from '../../lib/route/store.js'
import { formatDurationLabel, formatKm } from '../../lib/route/why.js'
import { liveItems, isMysteryHidden } from '../../lib/route/model.js'
import { useT } from '../../i18n/I18nProvider.jsx'
import { F, T } from '../tokens.js'
import { PrimaryButton } from '../ui/PrimaryButton.jsx'
import { GhostButton } from '../ui/GhostButton.jsx'
import RouteTimeline from '../ui/RouteTimeline.jsx'
import WhyThisSheet from '../ui/WhyThisSheet.jsx'
import { R, RouteSurface, routeCard, routeGhost, routeHeadline, routePrimary, routeType } from '../ui/RouteSurface.jsx'

export default function NativePlanScreen() {
  const t = useT()
  const navigate = useNavigate()
  const guest = readGuestContext()
  const catalog = useMemo(() => getRomeRankableCatalog(), [])
  const byId = useMemo(() => Object.fromEntries(catalog.map((item) => [item.id, item])), [catalog])
  const [why, setWhy] = useState(false)
  const proposed = useMemo(() => {
    return ensureProposedRoute({
      context: guest,
      catalog,
      position: guest.lastPosition,
      canAccess: canAccessContentId,
    })
  }, [catalog, guest])

  if (!proposed) {
    return (
      <RouteSurface testId="native-plan">
        <h1 style={routeHeadline}>{t('native.route.plan.empty')}</h1>
        <PrimaryButton color={T.gold} onClick={() => navigate('/home')} style={routePrimary}>{t('native.discover.seeAll')}</PrimaryButton>
      </RouteSurface>
    )
  }

  const items = liveItems(proposed)
  const outdoor = (proposed.tags || []).join(' · ')
  const heroPhoto = items
    .map((item) => (isMysteryHidden(item) ? null : byId[item.contentId]))
    .find((content) => content?.photo)?.photo

  return (
    <RouteSurface testId="native-plan">
      <p style={routeType}>{proposed.contextLine || t('native.route.based')}</p>
      <h1 style={routeHeadline}>{proposed.title || t('native.route.plan.headline')}</h1>
      <p data-testid="native-plan-stats" style={{ margin: '0 0 18px', color: R.muted, fontFamily: F.body }}>
        {formatDurationLabel(proposed.estimatedDurationMin)} · {formatKm(proposed.estimatedWalkingDistanceM)}
        {outdoor ? ` · ${outdoor}` : ''}
      </p>
      {heroPhoto ? (
        <div
          aria-hidden="true"
          style={{
            height: 168,
            borderRadius: 20,
            marginBottom: 16,
            backgroundImage: `url(${heroPhoto})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: `1px solid ${R.line}`,
            boxShadow: R.shadow,
          }}
        />
      ) : null}
      <div style={{ ...routeCard, marginBottom: 16 }}>
        <RouteTimeline items={items} catalogById={byId} />
      </div>
      {(proposed.rationale || []).map((line) => (
        <p key={line} style={{ margin: '0 0 16px', lineHeight: 1.5, fontFamily: F.body, color: R.ink }}>{line}</p>
      ))}
      <PrimaryButton color={T.gold} data-testid="plan-start" onClick={() => { startRoute(proposed); navigate('/route') }} style={routePrimary}>
        {t('native.route.start')}
      </PrimaryButton>
      <GhostButton data-testid="plan-adjust" onClick={() => navigate('/route/adjust')} style={{ marginTop: 10, ...routeGhost }}>
        {t('native.route.adjust')}
      </GhostButton>
      <GhostButton data-testid="plan-why" onClick={() => setWhy(true)} style={{ marginTop: 10, ...routeGhost }}>
        {t('native.route.why')}
      </GhostButton>
      <WhyThisSheet open={why} title={t('native.route.why')} body={proposed.summary} onClose={() => setWhy(false)} />
    </RouteSurface>
  )
}

export function refreshPlan() {
  const guest = readGuestContext()
  return composeAndSave({ context: guest, canAccess: canAccessContentId })
}
