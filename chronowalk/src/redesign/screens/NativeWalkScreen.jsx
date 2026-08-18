import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRegistryItem } from '../../content/rome/registry.js'
import { useRouteState } from '../../lib/route/useRouteState.js'
import { currentRouteItem, isMysteryHidden } from '../../lib/route/model.js'
import { endRoute, pauseRoute } from '../../lib/route/store.js'
import { useT } from '../../i18n/I18nProvider.jsx'
import { F, T } from '../tokens.js'
import { PrimaryButton } from '../ui/PrimaryButton.jsx'
import { GhostButton } from '../ui/GhostButton.jsx'
import RouteControlsSheet from '../ui/RouteControlsSheet.jsx'
import { R, RouteSurface, routeCard, routeGhost, routeHeadline, routePrimary, routeType } from '../ui/RouteSurface.jsx'

export default function NativeWalkScreen() {
  const t = useT()
  const navigate = useNavigate()
  const { active } = useRouteState()
  const [controls, setControls] = useState(false)
  const item = currentRouteItem(active)
  const content = item ? getRegistryItem(item.contentId) : null
  const mystery = item ? isMysteryHidden(item) : false

  if (!item) {
    return (
      <RouteSurface testId="native-walk">
        <h1 style={routeHeadline}>{t('native.route.walk.empty')}</h1>
        <PrimaryButton color={T.gold} onClick={() => navigate('/home')} style={routePrimary}>{t('native.discover.seeAll')}</PrimaryButton>
      </RouteSurface>
    )
  }

  const title = mystery ? t('native.route.mystery.title') : content?.title || item.contentId

  return (
    <RouteSurface testId="native-walk">
      <div
        data-testid="walk-map"
        style={{
          height: '48dvh',
          borderRadius: 20,
          background: `linear-gradient(180deg, color-mix(in srgb, ${R.teal} 12%, ${R.bg}) 0%, ${R.line} 100%)`,
          position: 'relative',
          marginBottom: 16,
          border: `1px solid ${R.line}`,
          boxShadow: R.shadow,
        }}
      >
        <span style={{ position: 'absolute', left: '18%', top: '70%', width: 14, height: 14, borderRadius: '50%', background: R.blue, boxShadow: `0 0 0 8px color-mix(in srgb, ${R.blue} 22%, transparent)` }} />
        <span style={{ position: 'absolute', left: '62%', top: '28%', width: mystery ? 12 : 16, height: mystery ? 12 : 16, borderRadius: '50%', background: mystery ? R.violet : T.gold, boxShadow: mystery ? `0 0 0 4px color-mix(in srgb, ${R.violet} 25%, transparent)` : '0 0 0 6px rgba(212,175,55,0.22)' }} />
      </div>
      <div style={{ ...routeCard, marginBottom: 12 }}>
        <p style={routeType}>{t('native.route.walkingTo')}</p>
        <h1 style={{ ...routeHeadline, fontSize: 24, margin: '8px 0 8px' }}>{title}</h1>
        <p style={{ margin: '0 0 14px', color: R.muted, fontFamily: F.body }}>
          {Number.isFinite(item.estimatedTransitMin) && item.estimatedTransitMin < 180
            ? `${item.estimatedTransitMin} min`
            : t('native.route.locationUnavailable')}
        </p>
        <PrimaryButton color={T.gold} data-testid="walk-arrive" onClick={() => navigate('/arrive')} style={routePrimary}>
          {t('native.route.iveArrived')}
        </PrimaryButton>
        <GhostButton data-testid="walk-route" onClick={() => navigate('/route')} style={{ marginTop: 10, ...routeGhost }}>
          {t('native.route.viewRoute')}
        </GhostButton>
        <GhostButton data-testid="walk-controls" onClick={() => setControls(true)} style={{ marginTop: 10, ...routeGhost }}>
          {t('native.route.pauseEnd')}
        </GhostButton>
      </div>
      <RouteControlsSheet
        open={controls}
        route={active}
        onClose={() => setControls(false)}
        onAction={(id) => {
          if (id === 'pause') pauseRoute()
          if (id === 'end') {
            endRoute()
            navigate('/home')
          }
          if (id === 'adjust') navigate('/route/adjust')
          setControls(false)
        }}
      />
      <p style={{ margin: '16px 0 0', color: R.muted, fontFamily: F.body, fontSize: 13 }}>{t('native.route.walkHint')}</p>
    </RouteSurface>
  )
}
