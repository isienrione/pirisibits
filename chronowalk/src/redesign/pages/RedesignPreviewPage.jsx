import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getWaypoint } from '../../content/manifest.js'
import { resolveSystemUrl } from '../../audio/audioUrl.js'
import { useTourManifest } from '../../hooks/useV2Journey.js'
import { buildCheckoutUrl, getHost } from '../../lib/host.js'
import { usePrice } from '../../hooks/usePrice.js'
import { track, TRACK_EVENTS } from '../../lib/track.js'
import {
  photoForWaypoint,
  thenPhotoForWaypoint,
  titleForWaypoint,
} from '../lib/waypointPresentation.js'
import { THEN_pantheon } from '../images.js'
import RedesignRouteShell from '../RedesignRouteShell.jsx'
import A2FreePreviewStory from '../screens/A2FreePreviewStory.jsx'

export default function RedesignPreviewPage() {
  const navigate = useNavigate()
  const { manifest, loading } = useTourManifest()
  const { cents, checkoutUrl } = usePrice()
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)

  const waypoint = useMemo(
    () => (manifest ? getWaypoint(manifest, 'w17') : null),
    [manifest],
  )

  const previewUrl = useMemo(
    () => (manifest?.system?.preview ? resolveSystemUrl(manifest.system.preview) : null),
    [manifest],
  )

  const handleUnlock = () => {
    const url = buildCheckoutUrl(checkoutUrl, { host: getHost(), abVariantCents: cents })
    if (url) {
      track(TRACK_EVENTS.CHECKOUT_OPEN, { price_cents: cents, source: 'preview' })
      window.location.assign(url)
      return
    }
    navigate('/access')
  }

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
      return
    }
    void audio.play().then(() => setPlaying(true)).catch(() => {})
  }

  if (loading) {
    return (
      <div className="redesign-app-shell" style={{ minHeight: '100dvh', background: '#16130F' }} />
    )
  }

  return (
    <RedesignRouteShell>
      <div className="redesign-app-shell">
        {previewUrl ? (
          <audio
            ref={audioRef}
            src={previewUrl}
            preload="metadata"
            onEnded={() => setPlaying(false)}
            onPause={() => setPlaying(false)}
            onPlay={() => setPlaying(true)}
          />
        ) : null}
        <A2FreePreviewStory
          title={waypoint ? titleForWaypoint(waypoint) : 'The Pantheon'}
          photo={waypoint ? photoForWaypoint(waypoint) : undefined}
          thenPhoto={waypoint ? thenPhotoForWaypoint(waypoint) : THEN_pantheon}
          tagline={waypoint?.approachLine ?? 'A temple to all gods — or a tomb for emperors?'}
          narrationPlaying={playing}
          onTogglePlay={togglePlay}
          onUnlock={handleUnlock}
          onBack={() => navigate('/landing')}
        />
      </div>
    </RedesignRouteShell>
  )
}
