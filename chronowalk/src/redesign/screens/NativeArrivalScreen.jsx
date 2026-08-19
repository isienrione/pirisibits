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
import NativePageHeader from '../ui/NativePageHeader.jsx'
import { PrimaryButton } from '../ui/PrimaryButton.jsx'
import { GhostButton } from '../ui/GhostButton.jsx'
import NativeCoverageSheet from '../ui/NativeCoverageSheet.jsx'
import { R, RouteSurface, routeGhost, routeHeadline, routePrimary, routeType } from '../ui/RouteSurface.jsx'

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
      <RouteSurface testId="native-arrive" header={<NativePageHeader backTo="/walk" />}>
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
    <RouteSurface testId="native-arrive" header={<NativePageHeader backTo="/walk" />}>
      {content.photo ? (
        <div
          aria-hidden="true"
          style={{
            height: 180,
            borderRadius: 20,
            marginBottom: 16,
            backgroundImage: `url(${content.photo})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: R.line,
            border: `1px solid ${R.line}`,
            boxShadow: R.shadow,
          }}
        />
      ) : null}
      <p style={routeType}>{t('native.route.arrived')}</p>
      <h1 style={routeHeadline}>{content.title}</h1>
      <p data-testid="arrive-copy" style={{ margin: '0 0 20px', lineHeight: 1.5, color: R.ink }}>
        {t('native.route.arrive.body')}
      </p>
      <PrimaryButton color={T.gold} data-testid="arrive-start" onClick={start} style={routePrimary}>
        {t('native.route.startExperience')}
      </PrimaryButton>
      <GhostButton data-testid="arrive-route" onClick={() => navigate('/route')} style={{ marginTop: 10, ...routeGhost }}>
        {t('native.route.viewRoute')}
      </GhostButton>
      <NativeCoverageSheet open={lock} item={content} onClose={() => setLock(false)} />
    </RouteSurface>
  )
}
