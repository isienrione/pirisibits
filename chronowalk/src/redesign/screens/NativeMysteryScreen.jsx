import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getRegistryItem } from '../../content/rome/registry.js'
import { acceptMystery, currentRouteItem, isMysteryHidden, revealMystery } from '../../lib/route/index.js'
import { trackMysteryOffered } from '../../lib/route/analytics.js'
import { useRouteState } from '../../lib/route/useRouteState.js'
import { useT } from '../../i18n/I18nProvider.jsx'
import { T } from '../tokens.js'
import { PrimaryButton } from '../ui/PrimaryButton.jsx'
import NativePageHeader from '../ui/NativePageHeader.jsx'
import MysteryCard from '../ui/MysteryCard.jsx'
import { R, RouteSurface, routeHeadline, routePrimary } from '../ui/RouteSurface.jsx'

export default function NativeMysteryScreen() {
  const t = useT()
  const navigate = useNavigate()
  const { routeItemId } = useParams()
  const { proposed, active } = useRouteState()
  const items = active?.items || proposed?.items || []
  const item = useMemo(
    () =>
      items.find((it) => it.routeItemId === routeItemId) ||
      items.find((it) => it.isMysteryDiscovery && it.state !== 'completed') ||
      currentRouteItem(active),
    [items, routeItemId, active],
  )
  const content = item ? getRegistryItem(item.contentId) : null
  const [flipped, setFlipped] = useState(() => (item ? !isMysteryHidden(item) : false))

  useEffect(() => {
    if (!item) return
    trackMysteryOffered({
      cityId: (active || proposed)?.cityId || 'rome',
      routeId: active?.proposedRouteId || proposed?.id,
      contentId: item.contentId,
      contentType: item.contentType,
      position: item.position,
    })
  }, [item?.routeItemId])

  if (!item) {
    return (
      <RouteSurface testId="native-mystery" header={<NativePageHeader backTo="/route" />}>
        <h1 style={routeHeadline}>{t('native.route.mysteryFront')}</h1>
        <PrimaryButton color={T.gold} onClick={() => navigate('/home')} style={routePrimary}>
          {t('native.discover.seeAll')}
        </PrimaryButton>
      </RouteSurface>
    )
  }

  return (
    <RouteSurface testId="native-mystery" header={<NativePageHeader backTo="/route" />}>
      <h1 style={{ ...routeHeadline, marginBottom: 16 }}>{t('native.route.mysteryFront')}</h1>
      <MysteryCard
        item={item}
        content={flipped ? content : null}
        flipped={flipped}
        walkMin={item.legKind === 'route' ? item.estimatedTransitMin : 0}
        experienceMin={item.estimatedExperienceMin || 3}
        onTake={() => {
          acceptMystery(item.routeItemId)
          navigate('/walk')
        }}
        onReveal={() => {
          revealMystery(item.routeItemId, { early: true })
          setFlipped(true)
        }}
        onStart={() => {
          acceptMystery(item.routeItemId)
          navigate('/walk')
        }}
      />
      <p style={{ marginTop: 16, color: R.muted, fontSize: 13 }}>{t('native.route.mysteryHint')}</p>
    </RouteSurface>
  )
}
