import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getWaypoint } from '../../content/manifest.js'
import { bindAutoplayHtmlAudio } from '../../audio/autoplayHtmlAudio.js'
import { resolvePreviewUrl } from '../../audio/audioUrl.js'
import { useTourManifest } from '../../hooks/useV2Journey.js'
import { openCheckout } from '../../lib/checkout.js'
import { track, TRACK_EVENTS } from '../../lib/track.js'
import { LANDING_PREVIEW_AUDIO_FILE } from '../../landing/landingData.js'
import {
  consumePreviewPlaybackIntent,
  getPreviewSessionAudio,
  retainPreviewPlaybackIntent,
  stopPreviewSessionAudio,
} from '../../landing/previewAudioHandoff.js'
import RedesignRouteShell from '../RedesignRouteShell.jsx'
import A2FreePreviewStory from '../screens/A2FreePreviewStory.jsx'
import A2PreviewGhostTour from '../screens/A2PreviewGhostTour.jsx'

export default function RedesignPreviewPage() {
  const navigate = useNavigate()
  const { manifest, loading } = useTourManifest()
  const audioRef = useRef(null)
  const [phase, setPhase] = useState('story')
  const [playing, setPlaying] = useState(false)
  const [audioError, setAudioError] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [storyEnded, setStoryEnded] = useState(false)
  const thresholdTrackedRef = useRef(false)

  const waypoint = useMemo(
    () => (manifest ? getWaypoint(manifest, 'w17') : null),
    [manifest],
  )

  const previewUrl = useMemo(
    () => resolvePreviewUrl(manifest?.system?.preview ?? LANDING_PREVIEW_AUDIO_FILE),
    [manifest],
  )

  const audioAvailable = !audioError && Boolean(previewUrl)

  useEffect(() => {
    track(TRACK_EVENTS.PREVIEW_START, { source: 'preview' })
  }, [])

  const attachAudioListeners = useCallback((audio) => {
    if (!audio) return () => {}

    const onTime = () => setCurrentTime(audio.currentTime)
    const onMeta = () => setDuration(audio.duration || 0)
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onEnded = () => {
      setPlaying(false)
      setStoryEnded(true)
    }
    const onError = () => setAudioError(true)

    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('durationchange', onMeta)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)

    if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
      setDuration(audio.duration || 0)
    }
    setCurrentTime(audio.currentTime)
    setPlaying(!audio.paused)
    if (audio.ended) setStoryEnded(true)

    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('durationchange', onMeta)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
    }
  }, [])

  useEffect(() => {
    if (!previewUrl) return undefined

    const audio = getPreviewSessionAudio(previewUrl)
    if (!audio) return undefined

    audioRef.current = audio
    const detach = attachAudioListeners(audio)

    const fromGesture = consumePreviewPlaybackIntent()
    let stopAutoplay = () => {}

    if (fromGesture || (!audio.paused && audio.currentTime > 0)) {
      if (audio.paused) {
        void audio.play().catch(() => {})
      }
    } else {
      stopAutoplay = bindAutoplayHtmlAudio(audio, {
        onPlaying: () => setPlaying(true),
      })
    }

    return () => {
      stopAutoplay()
      detach()
      retainPreviewPlaybackIntent()
    }
  }, [attachAudioListeners, previewUrl])

  useEffect(
    () => () => {
      requestAnimationFrame(() => {
        if (!window.location.pathname.endsWith('/preview')) {
          stopPreviewSessionAudio()
        }
      })
    },
    [],
  )

  const handleThresholdCross = () => {
    if (thresholdTrackedRef.current) return
    thresholdTrackedRef.current = true
    track(TRACK_EVENTS.THRESHOLD_DEMO, { source: 'preview' })
  }

  const handleUnlock = async () => {
    const result = await openCheckout({ tierId: 'rome-complete', source: 'preview' })
    if (result.ok) return
    // Purchase path only — never mix unlock with access-code entry.
    navigate('/landing#pricing')
  }

  const handleBack = () => {
    stopPreviewSessionAudio()
    navigate('/landing')
  }

  const handleStoryComplete = () => {
    setPhase('tour')
  }

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      return
    }
    void audio.play().catch(() => {})
  }

  if (loading) {
    return (
      <div className="redesign-app-shell" style={{ minHeight: '100dvh', background: '#0B0B0D' }} />
    )
  }

  return (
    <RedesignRouteShell>
      <div className="redesign-app-shell" style={{ height: '100dvh' }}>
        {phase === 'story' ? (
          <A2FreePreviewStory
            manifest={manifest}
            waypoint={waypoint}
            waypointId={waypoint?.id ?? 'w17'}
            narrationPlaying={playing}
            audioAvailable={audioAvailable}
            currentTime={currentTime}
            duration={duration}
            storyEnded={storyEnded}
            continueLabel="See the full tour →"
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
            onStoryComplete={handleStoryComplete}
            onBack={handleBack}
          />
        ) : (
          <A2PreviewGhostTour
            manifest={manifest}
            previewWaypointId={waypoint?.id ?? 'w17'}
            previewStopTitle={waypoint?.title ?? 'The Pantheon'}
            onUnlock={handleUnlock}
            onBack={handleBack}
          />
        )}
      </div>
    </RedesignRouteShell>
  )
}
