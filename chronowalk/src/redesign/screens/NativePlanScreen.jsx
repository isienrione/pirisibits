import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRomeRankableCatalog } from '../../content/rome/registry.js'
import { canAccessContentId } from '../../lib/contentAccess.js'
import { readGuestContext } from '../../lib/guestSession.js'
import { composeAndSave, ensureProposedRoute } from '../../lib/route/index.js'
import { startRoute } from '../../lib/route/store.js'
import { formatDurationLabel, formatKm } from '../../lib/route/why.js'
import { liveItems, isMysteryHidden } from '../../lib/route/model.js'
import { isHonestContentPhoto } from '../../content/registry/media.js'
import { useT } from '../../i18n/I18nProvider.jsx'
import { F, T } from '../tokens.js'
import { PrimaryButton } from '../ui/PrimaryButton.jsx'
import { GhostButton } from '../ui/GhostButton.jsx'
import NativePageHeader from '../ui/NativePageHeader.jsx'
import RoutePreview from '../ui/RoutePreview.jsx'
import PlaceMedia from '../ui/PlaceMedia.jsx'
import WhyThisSheet from '../ui/WhyThisSheet.jsx'
import { R, RouteSurface, routeGhost, routeHeadline, routePrimary, routeType } from '../ui/RouteSurface.jsx'

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
      <RouteSurface testId="native-plan" header={<NativePageHeader backTo="/home" />}>
        <h1 style={routeHeadline}>{t('native.route.plan.empty')}</h1>
        <PrimaryButton color={T.gold} onClick={() => navigate('/home')} style={routePrimary}>
          {t('native.discover.seeAll')}
        </PrimaryButton>
      </RouteSurface>
    )
  }

  const items = liveItems(proposed)
  const tags = proposed.tags || []
  const firstVisible = items.map((item) => (isMysteryHidden(item) ? null : byId[item.contentId])).find(Boolean)
  const heroItem = isHonestContentPhoto(firstVisible) ? firstVisible : firstVisible
  const limited = Boolean(proposed.inventoryLimited)

  return (
    <RouteSurface testId="native-plan" header={<NativePageHeader backTo="/home" />}>
      <PlaceMedia item={heroItem} height={188} radius={20} testId="plan-hero-media" />
      <p style={{ ...routeType, marginTop: 16 }}>{proposed.contextLine || t('native.route.based')}</p>
      <h1 data-testid="plan-title" style={{ ...routeHeadline, fontSize: 28 }}>
        {proposed.title || t('native.route.plan.headline')}
      </h1>
      <p data-testid="native-plan-stats" style={{ margin: '0 0 12px', color: R.muted, fontFamily: F.body, fontSize: 14 }}>
        {formatDurationLabel(proposed.estimatedDurationMin)} · {formatKm(proposed.estimatedWalkingDistanceM)}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {tags.map((tag) => (
          <span
            key={tag}
            style={{
              padding: '5px 10px',
              borderRadius: 999,
              border: `1px solid ${R.line}`,
              background: tag === 'mostly outdoors' ? `color-mix(in srgb, ${R.teal} 14%, ${R.cardWarm})` : R.cardWarm,
              color: R.ink,
              fontFamily: F.body,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {tag}
          </span>
        ))}
      </div>
      {(proposed.rationale || []).slice(0, 1).map((line) => (
        <p key={line} style={{ margin: '0 0 12px', lineHeight: 1.5, fontFamily: F.body, color: R.ink, fontSize: 15 }}>
          {line}
        </p>
      ))}
      {limited ? (
        <p data-testid="plan-inventory-limited" style={{ margin: '0 0 12px', lineHeight: 1.5, fontFamily: F.body, color: R.ink }}>
          {t('native.route.inventoryLimited')}
        </p>
      ) : null}
      <div className="native-plan-sticky-cta" data-testid="plan-sticky-cta">
        <PrimaryButton
          color={T.gold}
          data-testid="plan-start"
          onClick={() => {
            startRoute(proposed)
            navigate('/route')
          }}
          style={routePrimary}
        >
          {t('native.route.start')}
        </PrimaryButton>
        <GhostButton data-testid="plan-adjust" onClick={() => navigate('/route/adjust')} style={{ marginTop: 10, ...routeGhost }}>
          {t('native.route.adjust')}
        </GhostButton>
        <GhostButton data-testid="plan-why" onClick={() => setWhy(true)} style={{ marginTop: 10, ...routeGhost }}>
          {t('native.route.why')}
        </GhostButton>
      </div>
      <RoutePreview items={items} catalogById={byId} />
      <WhyThisSheet open={why} title={t('native.route.why')} body={proposed.summary} onClose={() => setWhy(false)} />
    </RouteSurface>
  )
}

export function refreshPlan() {
  const guest = readGuestContext()
  return composeAndSave({ context: guest, canAccess: canAccessContentId })
}
