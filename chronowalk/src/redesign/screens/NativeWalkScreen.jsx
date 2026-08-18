import { useMemo, useState } from 'react'
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
import { R, RouteSurface, routeHeadline, routeType } from '../ui/RouteSurface.jsx'

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
        <PrimaryButton color={T.gold} onClick={() => navigate('/home')}>{t('native.discover.seeAll')}</PrimaryButton>
      </RouteSurface>
    )
  }

  const title = mystery ? t('native.route.mystery.title') : content?.title || item.contentId

  return (
    <RouteSurface testId="native-walk">
      <p style={routeType}>{t('native.route.walkingTo')}</p>
      <h1 style={routeHeadline}>{title}</h1>
      <p style={{ margin: '0 0 18px', color: R.muted }}>
        {item.estimatedTransitMin} min · {Math.round(item.distanceFromPreviousM || 0)} m
      </p>
      <div
        data-testid="walk-map"
        style={{
          height: '42dvh',
          borderRadius: 20,
          background: 'linear-gradient(180deg, #DCE8E4 0%, #E9E2D5 100%)',
          position: 'relative',
          marginBottom: 16,
        }}
      >
        <span style={{ position: 'absolute', left: '18%', top: '70%', width: 14, height: 14, borderRadius: '50%', background: '#4E7D9B' }} />
        <span style={{ position: 'absolute', left: '62%', top: '28%', width: mystery ? 12 : 16, height: mystery ? 12 : 16, borderRadius: '50%', background: mystery ? R.sage : T.gold }} />
      </div>
      <PrimaryButton color={T.gold} data-testid="walk-arrive" onClick={() => navigate('/arrive')} style={{ minHeight: 48 }}>
        {t('native.route.iveArrived')}
      </PrimaryButton>
      <GhostButton data-testid="walk-route" onClick={() => navigate('/route')} style={{ marginTop: 10, minHeight: 48, color: R.ink, borderColor: R.line, background: 'transparent' }}>
        {t('native.route.viewRoute')}
      </GhostButton>
      <GhostButton data-testid="walk-controls" onClick={() => setControls(true)} style={{ marginTop: 10, minHeight: 48, color: R.ink, borderColor: R.line, background: 'transparent' }}>
        {t('native.route.pauseEnd')}
      </GhostButton>
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
