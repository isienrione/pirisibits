import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { resolvePreviewUrl } from '../../audio/audioUrl.js'
import { getWaypoint } from '../../content/manifest.js'
import { ThresholdChromeProvider } from '../../context/ThresholdChromeContext.jsx'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'
import { useTourManifest } from '../../hooks/useV2Journey.js'
import A2FreePreviewStory from '../../redesign/screens/A2FreePreviewStory.jsx'
import { LANDING_PREVIEW_AUDIO_FILE } from '../landingData.js'
import {
  trackLandingThresholdCancelled,
  trackLandingThresholdComplete,
  trackLandingThresholdStart,
} from '../landingAnalytics.js'
import LandingPhoneViewport from '../LandingPhoneViewport.jsx'

/** ~10s calm product loop: now → hold → then → audio → reset. */
const DEMO_IDLE_MS = 1100
const DEMO_HOLD_MS = 2600
const DEMO_AUDIO_MS = 3400
const DEMO_RESET_PAUSE_MS = 1600
const DEMO_USER_IDLE_MS = 14000

/**
 * Hero product phone — real Pantheon free-preview UI (A2 → C6 → Threshold).
 * Playable: hold to reveal, audio transport, Audio / Read instead tabs.
 *
 * @param {{
 *   onPlayingChange?: (playing: boolean) => void
 *   onContinue?: () => void
 *   autoAnimate?: boolean
 *   className?: string
 * }} props
 */
export default function RebuildProductPhone({
  onPlayingChange,
  onContinue,
  autoAnimate = true,
  className = '',
}) {
  const reducedMotion = useReducedMotion()
  const { manifest, loading } = useTourManifest()
  const rootRef = useRef(null)
  const audioRef = useRef(null)
  const demoTimersRef = useRef([])
  const userActiveRef = useRef(false)
  const demoRunningRef = useRef(false)
  const holdTrackedRef = useRef(false)
  const [playing, setPlaying] = useState(false)
  const [audioError, setAudioError] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [demoKey, setDemoKey] = useState(0)
  const [inView, setInView] = useState(true)

  const waypoint = useMemo(
    () => (manifest ? getWaypoint(manifest, 'w17') : null),
    [manifest],
  )

  const previewUrl = useMemo(
    () => resolvePreviewUrl(manifest?.system?.preview ?? LANDING_PREVIEW_AUDIO_FILE),
    [manifest],
  )

  const audioAvailable = !audioError && Boolean(previewUrl)

  const clearDemoTimers = useCallback(() => {
    for (const id of demoTimersRef.current) window.clearTimeout(id)
    demoTimersRef.current = []
    demoRunningRef.current = false
  }, [])

  const schedule = useCallback((fn, ms) => {
    const id = window.setTimeout(fn, ms)
    demoTimersRef.current.push(id)
    return id
  }, [])

  const setPlayingBoth = useCallback(
    (next) => {
      setPlaying(next)
      onPlayingChange?.(next)
    },
    [onPlayingChange],
  )

  useEffect(() => {
    const node = rootRef.current
    if (!node || typeof IntersectionObserver !== 'function') return undefined
    const io = new IntersectionObserver(
      ([entry]) => setInView(Boolean(entry?.isIntersecting && entry.intersectionRatio > 0.35)),
      { threshold: [0, 0.35, 0.6] },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!previewUrl) return undefined
    const audio = new Audio(previewUrl)
    audio.preload = 'metadata'
    audioRef.current = audio

    const onTime = () => setCurrentTime(audio.currentTime || 0)
    const onMeta = () => {
      if (Number.isFinite(audio.duration)) setDuration(audio.duration)
    }
    const onPlay = () => setPlayingBoth(true)
    const onPause = () => setPlayingBoth(false)
    const onEnded = () => {
      setPlayingBoth(false)
      setCurrentTime(0)
    }
    const onError = () => setAudioError(true)

    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)

    return () => {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
      audioRef.current = null
      onPlayingChange?.(false)
    }
  }, [onPlayingChange, previewUrl, setPlayingBoth])

  const pauseAudio = useCallback(() => {
    const audio = audioRef.current
    if (audio && !audio.paused) audio.pause()
  }, [])

  const playAudioFromStart = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return
    try {
      audio.currentTime = 0
      await audio.play()
    } catch {
      setPlayingBoth(false)
    }
  }, [setPlayingBoth])

  const markUserActive = useCallback(() => {
    userActiveRef.current = true
    clearDemoTimers()
    holdTrackedRef.current = false
  }, [clearDemoTimers])

  const findThresholdSurface = useCallback(() => {
    return rootRef.current?.querySelector?.('.threshold-root') ?? null
  }, [])

  const dispatchHold = useCallback(
    (phase) => {
      const surface = findThresholdSurface()
      if (!surface) return false
      const rect = surface.getBoundingClientRect()
      const clientX = rect.left + rect.width * 0.5
      const clientY = rect.top + rect.height * 0.42
      const eventInit = {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        pointerType: 'touch',
        isPrimary: true,
        clientX,
        clientY,
        buttons: phase === 'down' ? 1 : 0,
      }
      surface.dispatchEvent(new PointerEvent(`pointer${phase}`, eventInit))
      return true
    },
    [findThresholdSurface],
  )

  const runDemoCycle = useCallback(() => {
    if (!autoAnimate || reducedMotion || !inView || userActiveRef.current) return
    if (demoRunningRef.current) return
    demoRunningRef.current = true

    schedule(() => {
      if (userActiveRef.current || !inView) {
        demoRunningRef.current = false
        return
      }
      if (!holdTrackedRef.current) {
        holdTrackedRef.current = true
        trackLandingThresholdStart({ via: 'demo' })
      }
      dispatchHold('down')

      schedule(() => {
        if (userActiveRef.current) return
        dispatchHold('up')
        trackLandingThresholdComplete({ via: 'demo' })

        schedule(() => {
          if (userActiveRef.current) return
          void playAudioFromStart()

          schedule(() => {
            if (userActiveRef.current) return
            pauseAudio()

            schedule(() => {
              if (userActiveRef.current) return
              holdTrackedRef.current = false
              demoRunningRef.current = false
              setDemoKey((k) => k + 1)
            }, DEMO_RESET_PAUSE_MS)
          }, DEMO_AUDIO_MS)
        }, 280)
      }, DEMO_HOLD_MS)
    }, DEMO_IDLE_MS)
  }, [
    autoAnimate,
    dispatchHold,
    inView,
    pauseAudio,
    playAudioFromStart,
    reducedMotion,
    schedule,
  ])

  useEffect(() => {
    if (!waypoint || loading) return undefined
    if (!autoAnimate || reducedMotion || !inView) {
      clearDemoTimers()
      return undefined
    }
    if (userActiveRef.current) return undefined

    const boot = window.setTimeout(() => runDemoCycle(), 80)
    return () => {
      window.clearTimeout(boot)
      clearDemoTimers()
    }
  }, [autoAnimate, clearDemoTimers, demoKey, inView, loading, reducedMotion, runDemoCycle, waypoint])

  useEffect(() => {
    if (!inView) {
      pauseAudio()
      clearDemoTimers()
    }
  }, [clearDemoTimers, inView, pauseAudio])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined

    let idleTimer = null
    const onInteract = () => {
      markUserActive()
      if (idleTimer) window.clearTimeout(idleTimer)
      idleTimer = window.setTimeout(() => {
        userActiveRef.current = false
        holdTrackedRef.current = false
        setDemoKey((k) => k + 1)
      }, DEMO_USER_IDLE_MS)
    }

    root.addEventListener('pointerdown', onInteract, { capture: true })
    return () => {
      root.removeEventListener('pointerdown', onInteract, { capture: true })
      if (idleTimer) window.clearTimeout(idleTimer)
    }
  }, [markUserActive, waypoint, demoKey])

  const togglePlay = useCallback(() => {
    markUserActive()
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      void audio.play().catch(() => setPlayingBoth(false))
    } else {
      audio.pause()
    }
  }, [markUserActive, setPlayingBoth])

  const handleThresholdCross = useCallback(() => {
    if (!holdTrackedRef.current) {
      holdTrackedRef.current = true
      trackLandingThresholdComplete({ via: 'hold' })
    }
  }, [])

  const handleThresholdCancel = useCallback(() => {
    trackLandingThresholdCancelled({ via: 'hold' })
  }, [])

  // Reserved for future release-before-latch tracking.
  void handleThresholdCancel

  if (loading || !manifest || !waypoint) {
    return (
      <div ref={rootRef} className={`cw-rb-product-phone-wrap ${className}`.trim()}>
        <LandingPhoneViewport
          label="ChronoWalk at the Pantheon"
          size="hero"
          interactive={false}
          className="cw-rb-product-phone--hero"
        >
          <div className="cw-rb-product-phone__boot" aria-hidden />
        </LandingPhoneViewport>
      </div>
    )
  }

  return (
    <div ref={rootRef} className={`cw-rb-product-phone-wrap cw-rb-product-phone-wrap--hero ${className}`.trim()}>
      <LandingPhoneViewport
        label="ChronoWalk at the Pantheon"
        size="hero"
        interactive
        className="cw-rb-product-phone--hero"
      >
        <ThresholdChromeProvider>
          <div className="cw-rb-product-phone__app" key={demoKey}>
            <A2FreePreviewStory
              manifest={manifest}
              waypoint={waypoint}
              waypointId={waypoint.id ?? 'w17'}
              eyebrowLabel="FREE PREVIEW · PANTHEON"
              narrationPlaying={playing}
              audioAvailable={audioAvailable}
              currentTime={currentTime}
              duration={duration}
              continueLabel="See the full tour →"
              onTogglePlay={togglePlay}
              onSkipBack={() => {
                markUserActive()
                const audio = audioRef.current
                if (audio) audio.currentTime = Math.max(0, audio.currentTime - 15)
              }}
              onSkipForward={() => {
                markUserActive()
                const audio = audioRef.current
                if (audio) audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 15)
              }}
              onSeek={(seconds) => {
                markUserActive()
                const audio = audioRef.current
                if (audio) audio.currentTime = seconds
              }}
              onThresholdCross={handleThresholdCross}
              onStoryComplete={() => {
                markUserActive()
                pauseAudio()
                onContinue?.()
              }}
              onBack={() => {
                markUserActive()
              }}
            />
          </div>
        </ThresholdChromeProvider>
      </LandingPhoneViewport>
    </div>
  )
}
