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
import { formatDuration } from '../ui/NativeContentCard.jsx'

export default function NativeDiscoveryScreen() {
  const t = useT()
  const navigate = useNavigate()
  const { discoveryId } = useParams()
  const item = useMemo(() => getRegistryItem(discoveryId), [discoveryId])
  const [lockOpen, setLockOpen] = useState(false)
  const [saved, setSaved] = useState(() => isExperienceSaved(discoveryId))

  if (!item) {
    return <p style={{ color: T.bone, padding: 24 }}>Discovery unavailable.</p>
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
    <div
      data-testid="native-discovery"
      data-discovery-id={item.id}
      data-asset-source={import.meta.env.DEV ? item.mediaResolved?.source : undefined}
      style={{ minHeight: '100%', background: T.obsidian, color: T.bone, paddingBottom: 'calc(var(--shell-tab-bar-height, 72px) + 12px)' }}
    >
      <div
        style={{
          height: 220,
          backgroundImage: item.photo ? `url(${item.photo})` : 'none',
          backgroundSize: item.mediaResolved?.source === 'brand' ? '36%' : 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundColor: '#1a1a1f',
        }}
      />
      <div style={{ padding: '20px 20px 0' }}>
        <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.muted }}>
          {t('native.content.notice')} · {formatDuration(item.timeCostMin)}
        </p>
        <h1 style={{ fontFamily: F.display, fontWeight: 400, fontSize: 30, margin: '10px 0' }}>{item.title}</h1>
        <p style={{ margin: '0 0 14px', lineHeight: 1.5, color: 'rgba(250,246,239,0.88)', fontSize: 17 }}>{item.whyWorthIt}</p>
        {item.lookHere ? (
          <p style={{ margin: '0 0 14px', lineHeight: 1.5, color: T.gold }}>
            {item.lookHere}
          </p>
        ) : null}
        <p style={{ margin: '0 0 18px', lineHeight: 1.55, color: 'rgba(250,246,239,0.78)' }}>{item.body}</p>
        {item.accessNotes ? (
          <p style={{ margin: '0 0 18px', color: T.muted, fontSize: 13, lineHeight: 1.45 }}>{item.accessNotes}</p>
        ) : null}
        {playAudio ? (
          <p data-testid="discovery-audio" style={{ color: T.gold }}>{t('native.discovery.audio')}</p>
        ) : null}
        {playVisual ? (
          <p data-testid="discovery-visual" style={{ color: T.gold }}>{t('native.discovery.visual')}</p>
        ) : null}
        <PrimaryButton color={T.gold} data-testid="discovery-done" onClick={finish} style={{ minHeight: 48 }}>
          {locked ? t('native.experience.unlock') : t('native.discovery.done')}
        </PrimaryButton>
        <GhostButton data-testid="discovery-save" onClick={toggleSave} style={{ marginTop: 10, minHeight: 48 }}>
          {saved ? t('native.saved.remove') : t('native.saved.save')}
        </GhostButton>
        <GhostButton data-testid="discovery-keep" onClick={() => navigate('/home')} style={{ marginTop: 10, minHeight: 48 }}>
          {t('native.discovery.keep')}
        </GhostButton>
        <GhostButton
          data-testid="discovery-best-next"
          onClick={() => navigate(`/next?exclude=${encodeURIComponent(item.id)}`)}
          style={{ marginTop: 10, minHeight: 48 }}
        >
          {t('native.next.eyebrow')}
        </GhostButton>
      </div>
      <NativeCoverageSheet open={lockOpen} item={item} onClose={() => setLockOpen(false)} />
    </div>
  )
}

export function discoveryPath(id) {
  return contentRoute({ contentType: 'discovery', id })
}
