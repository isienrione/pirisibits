import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRegistryItem } from '../../content/rome/registry.js'
import { canAccessContentId } from '../../lib/contentAccess.js'
import { startHeroExperience } from '../../lib/heroExperience.js'
import { CONTENT_TYPES } from '../../content/registry/constants.js'
import { useRouteState } from '../../lib/route/useRouteState.js'
import { currentRouteItem, isMysteryHidden } from '../../lib/route/model.js'
import { revealMystery } from '../../lib/route/store.js'
import { useT } from '../../i18n/I18nProvider.jsx'
import { T } from '../tokens.js'
import { PrimaryButton } from '../ui/PrimaryButton.jsx'
import { GhostButton } from '../ui/GhostButton.jsx'
import NativeCoverageSheet from '../ui/NativeCoverageSheet.jsx'
import { R, RouteSurface, routeHeadline, routeType } from '../ui/RouteSurface.jsx'

export default function NativeArrivalScreen() {
  const t = useT()
  const navigate = useNavigate()
  const { active } = useRouteState()
  const item = currentRouteItem(active)
  const [lock, setLock] = useState(false)

  useEffect(() => {
    if (item?.isMysteryDiscovery && isMysteryHidden(item)) {
      revealMystery(item.routeItemId, { arrival: true })
    }
  }, [item?.routeItemId, item?.isMysteryDiscovery])

  const content = item ? getRegistryItem(item.contentId) : null
  if (!item || !content) {
    return (
      <RouteSurface testId="native-arrive">
        <h1 style={routeHeadline}>{t('native.route.arrive.empty')}</h1>
      </RouteSurface>
    )
  }

  const start = () => {
    if (!canAccessContentId(item.contentId)) {
      setLock(true)
      return
    }
    if (item.contentType === CONTENT_TYPES.DISCOVERY) {
      navigate(`/discovery/${item.contentId}`)
      return
    }
    startHeroExperience(item.contentId, { navigate })
  }

  return (
    <RouteSurface testId="native-arrive">
      <p style={routeType}>{t('native.route.arrived')}</p>
      <h1 style={routeHeadline}>{content.title}</h1>
      <p data-testid="arrive-copy" style={{ margin: '0 0 20px', lineHeight: 1.5, color: R.ink }}>
        {t('native.route.arrive.body')}
      </p>
      <PrimaryButton color={T.gold} data-testid="arrive-start" onClick={start} style={{ minHeight: 48 }}>
        {t('native.route.startExperience')}
      </PrimaryButton>
      <GhostButton data-testid="arrive-route" onClick={() => navigate('/route')} style={{ marginTop: 10, minHeight: 48, color: R.ink, borderColor: R.line, background: 'transparent' }}>
        {t('native.route.viewRoute')}
      </GhostButton>
      <NativeCoverageSheet open={lock} item={content} onClose={() => setLock(false)} />
    </RouteSurface>
  )
}
