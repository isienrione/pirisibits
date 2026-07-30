import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getWaypoint } from '../../content/manifest.js'
import { resolveNarrationUrl } from '../../audio/audioUrl.js'
import { bindAutoplayHtmlAudio } from '../../audio/autoplayHtmlAudio.js'
import { chapterFile } from '../../content/chapterMeta.js'
import { useTourManifest } from '../../hooks/useV2Journey.js'
import { track, TRACK_EVENTS } from '../../lib/track.js'
import { buildImmersivePlayerProps } from '../lib/waypointImmersiveProps.js'
import { T } from '../tokens.js'
import RedesignRouteShell from '../RedesignRouteShell.jsx'
import C6ImmersivePlayer from '../screens/C6ImmersivePlayer.jsx'

const DEFAULT_PREVIEW_WAYPOINT = 'w01'

/** Dev/preview route · unified immersive layout for any manifest waypoint. */
export default function RedesignWaypointPreviewPage({ waypointId: waypointIdProp = null }) {
  const navigate = useNavigate()
  const { waypointId: waypointIdParam } = useParams()
  const waypointId = waypointIdProp ?? waypointIdParam ?? DEFAULT_PREVIEW_WAYPOINT

  const { manifest, loading } = useTourManifest()
  const audioRef = useRef(null)
  const [audioNode, setAudioNode] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [audioError, setAudioError] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const thresholdTrackedRef = useRef(false)

  const waypoint = useMemo(
    () => (manifest ? getWaypoint(manifest, waypointId) : null),
    [manifest, waypointId],
  )

  const narrationFile = waypoint?.chapters?.[0] ? chapterFile(waypoint.chapters[0]) : `${waypointId}.mp3`
  const narrationUrl = useMemo(() => resolveNarrationUrl(narrationFile), [narrationFile])
  const audioAvailable = Boolean(narrationUrl) && !audioError

  useEffect(() => {
    track(TRACK_EVENTS.PREVIEW_START, { source: 'waypoint_preview', waypoint_id: waypointId })
  }, [waypointId])

  useEffect(() => {
    setPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setAudioError(false)
    setAudioNode(null)
    thresholdTrackedRef.current = false
  }, [waypointId, narrationUrl])

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
  }, [audioAvailable, audioNode, narrationUrl])

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

  const handleThresholdCross = () => {
    if (thresholdTrackedRef.current) return
    thresholdTrackedRef.current = true
    track(TRACK_EVENTS.THRESHOLD_HOLD, { source: 'waypoint_preview', waypoint_id: waypointId })
  }

  if (loading) {
    return (
      <div className="redesign-app-shell" style={{ minHeight: '100dvh', background: '#0B0B0D' }} />
    )
  }

  if (!waypoint) {
    return (
      <RedesignRouteShell>
        <div className="redesign-app-shell" style={{ padding: 24, color: T.warmWhite }}>
          <p>Unknown waypoint: {waypointId}</p>
          <button type="button" onClick={() => navigate('/landing')}>Back</button>
        </div>
      </RedesignRouteShell>
    )
  }

  const playerProps = buildImmersivePlayerProps({
    waypoint,
    waypointId,
    manifest,
    audio: {
      narrationPlaying: playing,
      currentTime,
      duration,
      audioAvailable,
    },
    handlers: {
      onTogglePlay: togglePlay,
      onSkipBack: () => {
        const audio = audioRef.current
        if (audio) audio.currentTime = Math.max(0, audio.currentTime - 15)
      },
      onSkipForward: () => {
        const audio = audioRef.current
        if (audio) audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 15)
      },
      onSeek: (seconds) => {
        const audio = audioRef.current
        if (audio) audio.currentTime = seconds
      },
      onThresholdCross: handleThresholdCross,
      onBack: () => navigate('/landing'),
    },
  })

  return (
    <RedesignRouteShell>
      <div className="redesign-app-shell" style={{ height: '100dvh' }}>
        {narrationUrl ? (
          <audio
            key={narrationUrl}
            ref={(node) => {
              audioRef.current = node
              setAudioNode(node)
            }}
            src={narrationUrl}
            preload="auto"
            onEnded={() => setPlaying(false)}
            onPause={() => setPlaying(false)}
            onPlay={() => setPlaying(true)}
            onError={() => setAudioError(true)}
          />
        ) : null}
        <C6ImmersivePlayer {...playerProps} />
      </div>
    </RedesignRouteShell>
  )
}
