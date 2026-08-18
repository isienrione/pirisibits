import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getRegistryItem, contentRoute } from '../../content/rome/registry.js'
import { hasPlayableAudio, hasPlayableVisual } from '../../content/registry/media.js'
import { canAccessContentId } from '../../lib/contentAccess.js'
import {
  isExperienceSaved,
  recordCompletedExperience,
  recordSavedExperience,
  removeSavedExperience,
} from '../../lib/guestSession.js'
import { track, TRACK_EVENTS } from '../../lib/track.js'
import { completeRouteContent } from '../../lib/route/complete.js'
import { useT } from '../../i18n/I18nProvider.jsx'
import { F, T } from '../tokens.js'
import { GhostButton } from '../ui/GhostButton.jsx'
import { PrimaryButton } from '../ui/PrimaryButton.jsx'
import NativeCoverageSheet from '../ui/NativeCoverageSheet.jsx'
import PlaceMedia from '../ui/PlaceMedia.jsx'
import { formatDuration } from '../ui/NativeContentCard.jsx'
import { R, RouteSurface, routeGhost, routePrimary, routeType } from '../ui/RouteSurface.jsx'

export default function NativeDiscoveryScreen() {
  const t = useT()
  const navigate = useNavigate()
  const { discoveryId } = useParams()
  const item = useMemo(() => getRegistryItem(discoveryId), [discoveryId])
  const [lockOpen, setLockOpen] = useState(false)
  const [saved, setSaved] = useState(() => isExperienceSaved(discoveryId))

  if (!item) {
    return (
      <RouteSurface testId="native-discovery">
        <p style={{ color: R.ink }}>Discovery unavailable.</p>
      </RouteSurface>
    )
  }

  const locked = !canAccessContentId(item.id)
  const playAudio = hasPlayableAudio(item)
  const playVisual = hasPlayableVisual(item)

  const toggleSave = () => {
    if (saved) removeSavedExperience(item.id)
    else recordSavedExperience(item.id)
    setSaved(!saved)
  }

  const finish = () => {
    if (locked) {
      setLockOpen(true)
      return
    }
    recordCompletedExperience(item.id)
    track(TRACK_EVENTS.RECOMMENDATION_ACCEPTED, { content_id: item.id, type: 'discovery' })
    if (completeRouteContent(item.id)) {
      navigate('/next')
      return
    }
    navigate(`/next?exclude=${encodeURIComponent(item.id)}`)
  }

  return (
    <RouteSurface
      testId="native-discovery"
      data-bright="true"
      style={{ paddingLeft: 0, paddingRight: 0 }}
    >
      <div
        data-discovery-id={item.id}
        data-asset-source={import.meta.env.DEV ? item.mediaResolved?.source : undefined}
        data-bright="true"
        style={{ color: R.ink }}
      >
        <div style={{ padding: '0 20px' }}>
          <PlaceMedia item={item} height={220} radius={20} />
        </div>
        <div style={{ padding: '18px 20px 0' }}>
          <p style={routeType}>
            {t('native.content.notice')} · {formatDuration(item.timeCostMin)}
          </p>
          <h1 style={{ fontFamily: F.display, fontWeight: 400, fontSize: 26, margin: '8px 0', color: R.ink, lineHeight: 1.2 }}>
            {item.title}
          </h1>
          <p style={{ margin: '0 0 12px', lineHeight: 1.45, color: R.ink, fontSize: 16, fontFamily: F.body }}>
            {item.whyWorthIt}
          </p>
          {item.lookHere ? (
            <p
              data-testid="discovery-look-here"
              style={{
                margin: '0 0 12px',
                lineHeight: 1.45,
                color: R.terracotta,
                fontFamily: F.body,
                fontWeight: 600,
              }}
            >
              {t('native.discovery.lookHere')} {item.lookHere}
            </p>
          ) : null}
          {item.body ? (
            <p style={{ margin: '0 0 16px', lineHeight: 1.5, color: R.muted, fontSize: 14, fontFamily: F.body }}>
              {item.body}
            </p>
          ) : null}
          {playAudio ? (
            <p data-testid="discovery-audio" style={{ color: R.gold, fontFamily: F.body }}>
              {t('native.discovery.audio')}
            </p>
          ) : null}
          {playVisual ? (
            <p data-testid="discovery-visual" style={{ color: R.gold, fontFamily: F.body }}>
              {t('native.discovery.visual')}
            </p>
          ) : null}
          <GhostButton data-testid="discovery-save" onClick={toggleSave} style={{ marginTop: 8, ...routeGhost }}>
            {saved ? t('native.saved.remove') : t('native.saved.save')}
          </GhostButton>
          <PrimaryButton
            color={T.gold}
            data-testid="discovery-done"
            onClick={finish}
            style={{ marginTop: 10, ...routePrimary }}
          >
            {locked ? t('native.experience.unlock') : t('native.discovery.done')}
          </PrimaryButton>
          <GhostButton data-testid="discovery-keep" onClick={() => navigate('/home')} style={{ marginTop: 10, ...routeGhost }}>
            {t('native.discovery.keep')}
          </GhostButton>
        </div>
      </div>
      <NativeCoverageSheet open={lockOpen} item={item} onClose={() => setLockOpen(false)} />
    </RouteSurface>
  )
}

export function discoveryPath(id) {
  return contentRoute({ contentType: 'discovery', id })
}
