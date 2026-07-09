import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getWaypoint } from '../../content/manifest.js'
import { bindAutoplayHtmlAudio } from '../../audio/autoplayHtmlAudio.js'
import { resolvePreviewUrl } from '../../audio/audioUrl.js'
import { useTourManifest } from '../../hooks/useV2Journey.js'
import { buildCheckoutUrl, getHost } from '../../lib/host.js'
import { usePrice } from '../../hooks/usePrice.js'
import { track, TRACK_EVENTS } from '../../lib/track.js'
import RedesignRouteShell from '../RedesignRouteShell.jsx'
import A2FreePreviewStory from '../screens/A2FreePreviewStory.jsx'

export default function RedesignPreviewPage() {
  const navigate = useNavigate()
  const { manifest, loading } = useTourManifest()
  const { cents, checkoutUrl } = usePrice()
  const audioRef = useRef(null)
  const [audioNode, setAudioNode] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [audioError, setAudioError] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const thresholdTrackedRef = useRef(false)

  const waypoint = useMemo(
    () => (manifest ? getWaypoint(manifest, 'w17') : null),
    [manifest],
  )

  const previewUrl = useMemo(
    () => (manifest?.system?.preview ? resolvePreviewUrl(manifest.system.preview) : null),
    [manifest],
  )

  const audioAvailable = Boolean(previewUrl) && !audioError

  useEffect(() => {
    track(TRACK_EVENTS.PREVIEW_START, { source: 'preview' })
  }, [])

  useEffect(() => {
    setPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setAudioError(false)
    setAudioNode(null)
    thresholdTrackedRef.current = false
  }, [previewUrl])

  useEffect(() => {
    const audio = audioNode
    if (!audio || !audioAvailable) return undefined

    const onTime = () => setCurrentTime(audio.currentTime)
    const onMeta = () => setDuration(audio.duration || 0)
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('durationchange', onMeta)

    const stopAutoplay = bindAutoplayHtmlAudio(audio, {
      onPlaying: () => setPlaying(true),
    })

    return () => {
      stopAutoplay()
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('durationchange', onMeta)
    }
  }, [audioAvailable, audioNode, previewUrl])

  const handleThresholdCross = () => {
    if (thresholdTrackedRef.current) return
    thresholdTrackedRef.current = true
    track(TRACK_EVENTS.THRESHOLD_DEMO, { source: 'preview' })
  }

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
      <div className="redesign-app-shell" style={{ height: '100dvh' }}>
        {previewUrl ? (
          <audio
            key={previewUrl}
            ref={(node) => {
              audioRef.current = node
              setAudioNode(node)
            }}
            src={previewUrl}
            preload="auto"
            onEnded={() => setPlaying(false)}
            onPause={() => setPlaying(false)}
            onPlay={() => setPlaying(true)}
            onError={() => setAudioError(true)}
          />
        ) : null}
        <A2FreePreviewStory
          manifest={manifest}
          waypoint={waypoint}
          waypointId={waypoint?.id ?? 'w17'}
          narrationPlaying={playing}
          audioAvailable={audioAvailable}
          currentTime={currentTime}
          duration={duration}
          onTogglePlay={togglePlay}
          onSkipBack={() => {
            const audio = audioRef.current
            if (audio) audio.currentTime = Math.max(0, audio.currentTime - 15)
          }}
          onSkipForward={() => {
            const audio = audioRef.current
            if (audio) audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 15)
          }}
          onSeek={(seconds) => {
            const audio = audioRef.current
            if (audio) audio.currentTime = seconds
          }}
          onThresholdCross={handleThresholdCross}
          onUnlock={handleUnlock}
          onBack={() => navigate('/landing')}
        />
      </div>
    </RedesignRouteShell>
  )
}
