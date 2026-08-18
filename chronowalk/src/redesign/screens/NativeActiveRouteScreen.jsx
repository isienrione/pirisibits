import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRomeRankableCatalog } from '../../content/rome/registry.js'
import { useRouteState } from '../../lib/route/useRouteState.js'
import { endRoute, pauseRoute, resumeRoute } from '../../lib/route/store.js'
import { estimateRouteTotals, liveItems } from '../../lib/route/model.js'
import { formatDurationLabel } from '../../lib/route/why.js'
import { evaluateRouteSuggestion } from '../../lib/route/suggestion.js'
import { ROUTE_PROACTIVE_SUGGESTIONS } from '../../lib/route/constants.js'
import { readGuestContext } from '../../lib/guestSession.js'
import { useT } from '../../i18n/I18nProvider.jsx'
import { F, T } from '../tokens.js'
import { PrimaryButton } from '../ui/PrimaryButton.jsx'
import { GhostButton } from '../ui/GhostButton.jsx'
import RoutePreview from '../ui/RoutePreview.jsx'
import RouteControlsSheet from '../ui/RouteControlsSheet.jsx'
import { R, RouteSurface, routeCard, routeGhost, routeHeadline, routePrimary, routeType } from '../ui/RouteSurface.jsx'

export default function NativeActiveRouteScreen() {
  const t = useT()
  const navigate = useNavigate()
  const { active } = useRouteState()
  const catalog = useMemo(() => getRomeRankableCatalog(), [])
  const byId = useMemo(() => Object.fromEntries(catalog.map((item) => [item.id, item])), [catalog])
  const [controls, setControls] = useState(false)
  const guest = readGuestContext()

  if (!active || (active.status !== 'active' && active.status !== 'paused')) {
    return (
      <RouteSurface testId="native-active-route">
        <h1 style={routeHeadline}>{t('native.route.active.empty')}</h1>
        <PrimaryButton color={T.gold} onClick={() => navigate('/plan')} style={routePrimary}>
          {t('native.route.seePlan')}
        </PrimaryButton>
      </RouteSurface>
    )
  }

  const totals = estimateRouteTotals(active.items)
  const suggestion = evaluateRouteSuggestion({ active, context: guest, enabled: ROUTE_PROACTIVE_SUGGESTIONS })

  return (
    <RouteSurface testId="native-active-route">
      <div data-testid="route-summary">
        <p style={routeType}>{active.title || t('native.route.yourAfternoon')}</p>
        <h1 data-testid="active-route-title" style={{ ...routeHeadline, fontSize: 26 }}>
          {formatDurationLabel(totals.estimatedDurationMin)} {t('native.route.remaining')}
        </h1>
        <p style={{ margin: '0 0 16px', color: R.muted, fontFamily: F.body }}>
          {totals.completedCount} {t('native.route.of')} {totals.totalCount} {t('native.route.completed')}
        </p>
      </div>
      <RoutePreview items={liveItems(active)} catalogById={byId} currentId={active.currentRouteItemId} />
      {suggestion ? (
        <div
          data-testid="route-suggestion"
          style={{
            ...routeCard,
            marginTop: 16,
            padding: 14,
            borderRadius: 16,
            borderLeft: `3px solid ${R.gold}`,
          }}
        >
          <p style={{ margin: 0, fontFamily: F.body, color: R.ink }}>{suggestion.message}</p>
        </div>
      ) : null}
      <PrimaryButton
        color={T.gold}
        data-testid="active-route-walk"
        onClick={() => navigate('/walk')}
        style={{ marginTop: 16, ...routePrimary }}
      >
        {t('native.route.continueWalk')}
      </PrimaryButton>
      <GhostButton data-testid="active-route-controls" onClick={() => setControls(true)} style={{ marginTop: 10, ...routeGhost }}>
        {t('native.route.changeIt')}
      </GhostButton>
      <RouteControlsSheet
        open={controls}
        route={active}
        onClose={() => setControls(false)}
        onAction={(id) => {
          if (id === 'adjust' || id === 'reorder' || id === 'add' || id === 'add-saved') navigate('/route/adjust')
          if (id === 'pause') pauseRoute()
          if (id === 'resume') resumeRoute()
          if (id === 'end') {
            endRoute()
            navigate('/home')
          }
          setControls(false)
        }}
      />
    </RouteSurface>
  )
}
