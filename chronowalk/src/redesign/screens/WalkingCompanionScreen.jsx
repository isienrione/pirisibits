import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { T } from '../tokens.js'
import { LOCATION_STATUS } from '../../hooks/useGeoLocation.js'
import { useWalkingDirections } from '../../hooks/useWalkingDirections.js'
import { resolveWalkingStepProgress } from '../../utils/walkingStepProgress.js'
import { pantheonNow } from '../images.js'
import FloatingTransitAudioPlayer from '../ui/FloatingTransitAudioPlayer.jsx'
import TransitNarrationSheet from '../ui/TransitNarrationSheet.jsx'
import WalkingCompanionStepsPanel from '../ui/WalkingCompanionStepsPanel.jsx'
import { pickApproachCue } from '../lib/walkingApproachCues.js'
import { formatDistanceLine } from '../lib/walkingCompanionFormat.js'
import {
  isWithinApproachDistance,
  resolveWalkingCompanionPhase,
  resolveWalkingDistanceCopy,
  shouldShowTransitMiniPlayer,
} from '../lib/walkingCompanionPhase.js'

/**
 * One adaptive layout for walking between stops (waypoint legs + transits).
 * Presentation only — callers supply routing, GPS, and narration handlers.
 */
export default function WalkingCompanionScreen({
  accent = T.actI,
  title = 'The Pantheon',
  photo = pantheonNow,
  actNumeral = 'I',
  stopKey = 'default',
  map,
  userPosition = null,
  destination = null,
  legFallback = null,
  distanceM = null,
  estimatedDistanceM = null,
  locationStatus = LOCATION_STATUS.WAITING,
  onRetryLocation,
  arrived = false,
  near = false,
  mode = 'waypoint',
  narrationPlaying = false,
  narrationPaused = false,
  currentTime = 0,
  duration = 0,
  playbackRate = 1,
  transcript = '',
  trackTitle = null,
  onToggleAudio,
  onSkipBack,
  onSkipForward,
  onSeek,
  onCycleSpeed,
  onBeginChapter,
  onPrimeAudio,
  onContinue,
  continueLabel = 'Continue walking →',
  onPause,
  extraBottomInset = 0,
  beginChapterLabel = 'Begin Chapter',
  testId = 'walking-companion-screen',
  walkingUiRev,
}) {
  const [fullPlayerOpen, setFullPlayerOpen] = useState(false)
  const [userConfirmedArrival, setUserConfirmedArrival] = useState(false)
  const [dragProgress, setDragProgress] = useState(null)
  const [routeView, setRouteView] = useState('map')
  const approachCueRef = useRef(null)

  const showArrivedUI = arrived || userConfirmedArrival

  const { directions, loading: directionsLoading, error: directionsError, retry: retryDirections } =
    useWalkingDirections({
      origin: userPosition,
      destination,
      legFallback,
      destinationName: title,
      enabled: !showArrivedUI && Boolean(destination),
    })

  const walkingStepProgress = useMemo(
    () =>
      resolveWalkingStepProgress({
        userPos: userPosition,
        steps: directions?.steps ?? [],
        geometry: directions?.geometry,
        totalDistanceM: directions?.distanceM ?? 0,
      }),
    [userPosition, directions?.steps, directions?.geometry, directions?.distanceM],
  )

  useEffect(() => {
    if (arrived) setUserConfirmedArrival(true)
  }, [arrived])

  useEffect(() => {
    setUserConfirmedArrival(false)
    setFullPlayerOpen(false)
    setRouteView('map')
    approachCueRef.current = null
  }, [stopKey])

  const approaching =
    !showArrivedUI && (near || isWithinApproachDistance(distanceM))

  const approachCue = useMemo(() => {
    if (!approaching) return null
    if (!approachCueRef.current) {
      approachCueRef.current = pickApproachCue(stopKey)
    }
    return approachCueRef.current
  }, [approaching, stopKey])

  const phase = resolveWalkingCompanionPhase({
    showArrivedUI,
    distanceM,
    near,
  })

  const distanceCopy = resolveWalkingDistanceCopy(
    distanceM,
    estimatedDistanceM,
    locationStatus,
  )
  const distanceLine = formatDistanceLine(distanceCopy)
  const showGpsHelp = !showArrivedUI && distanceCopy.gpsBlocked
  const subtitleKey = showArrivedUI ? 'arrived' : approaching ? 'near' : 'walking'
  const subtitleText = approaching ? approachCue : distanceLine

  const liveProgress = duration > 0 ? Math.min(Math.max(currentTime / duration, 0), 1) : 0
  const progress = dragProgress ?? liveProgress
  const canSeek = typeof onSeek === 'function' && duration > 0
  const displayTime = dragProgress != null ? dragProgress * duration : currentTime
  const remaining = duration > 0 ? Math.max(duration - displayTime, 0) : 0

  const showMiniPlayer =
    shouldShowTransitMiniPlayer({
      mode,
      transcript,
      duration,
      currentTime,
      narrationPlaying,
      narrationPaused,
      showArrivedUI,
    }) && typeof onToggleAudio === 'function'

  const seekFromClientX = (clientX, trackRef) => {
    const el = trackRef?.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    if (rect.width <= 0) return null
    return Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
  }

  const handleSeekPointerDown = (e, trackRef) => {
    if (!canSeek) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    const frac = seekFromClientX(e.clientX, trackRef)
    if (frac != null) setDragProgress(frac)
  }

  const handleSeekPointerMove = (e, trackRef) => {
    if (!canSeek || dragProgress == null) return
    const frac = seekFromClientX(e.clientX, trackRef)
    if (frac != null) setDragProgress(frac)
  }

  const handleSeekPointerUp = (e, trackRef) => {
    if (!canSeek || dragProgress == null) return
    const frac = seekFromClientX(e.clientX, trackRef) ?? dragProgress
    setDragProgress(null)
    onSeek(frac * duration)
  }

  const beginChapterTestId =
    mode === 'transit' ? 'transit-arrive-destination' : 'walking-begin-chapter'

  return (
    <div
      className={`cw-walking-companion cw-walking-companion--${phase}`}
      data-testid={testId}
      data-walking-ui-rev={walkingUiRev}
      data-walking-phase={phase}
      style={{
        '--wc-accent': accent,
        '--wc-success': T.actII,
        '--wc-footer-extra': `${extraBottomInset}px`,
      }}
    >
      <header className="cw-walking-companion__header">
        {showArrivedUI ? (
          <div className="cw-walking-companion__arrived-copy">
            <div className="cw-walking-companion__arrived-badge" aria-hidden>
              <CheckCircle2 size={20} strokeWidth={2} />
            </div>
            <p className="cw-walking-companion__arrived-label">You have arrived</p>
            <h1 className="cw-walking-companion__title">{title}</h1>
          </div>
        ) : (
          <>
            <p className="cw-walking-companion__act">ACT {actNumeral}</p>
            <p className="cw-walking-companion__eyebrow">Walking to</p>

            <div className="cw-walking-companion__title-row">
              <h1 className="cw-walking-companion__title">{title}</h1>
              {photo ? (
                <img className="cw-walking-companion__thumb" src={photo} alt="" />
              ) : null}
            </div>

            <div className="cw-walking-companion__subtitle" aria-live="polite">
              <p
                key={subtitleKey}
                className={
                  approaching
                    ? 'cw-walking-companion__cue'
                    : 'cw-walking-companion__distance'
                }
                data-testid={approaching ? 'walking-approach-cue' : undefined}
              >
                {subtitleText}
              </p>
            </div>
          </>
        )}

        {showGpsHelp ? (
          <p className="cw-walking-companion__gps-note">
            Location off
            {onRetryLocation ? (
              <button type="button" className="cw-wc-pressable" onClick={onRetryLocation}>
                Retry
              </button>
            ) : null}
          </p>
        ) : null}
      </header>

      <div className="cw-walking-companion__map-wrap">
        {!showArrivedUI ? (
          <div className="cw-walking-companion__view-toggle" role="tablist" aria-label="Route view">
            <button
              type="button"
              role="tab"
              aria-selected={routeView === 'map'}
              className={`cw-walking-companion__view-btn cw-wc-pressable${routeView === 'map' ? ' cw-walking-companion__view-btn--active' : ''}`}
              onClick={() => setRouteView('map')}
            >
              Map
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={routeView === 'steps'}
              className={`cw-walking-companion__view-btn cw-wc-pressable${routeView === 'steps' ? ' cw-walking-companion__view-btn--active' : ''}`}
              onClick={() => setRouteView('steps')}
            >
              Steps
            </button>
          </div>
        ) : null}

        <div className="cw-walking-companion__hero-stack">
          {showArrivedUI ? (
            <div
              className="cw-walking-companion__hero-layer cw-walking-companion__hero-layer--arrived cw-walking-companion__hero-layer--visible"
            >
              {photo ? (
                <img className="cw-walking-companion__arrived-photo" src={photo} alt="" />
              ) : null}
              <div className="cw-walking-companion__arrived-photo-scrim" aria-hidden />
            </div>
          ) : routeView === 'steps' ? (
            <WalkingCompanionStepsPanel
              steps={directions?.steps ?? []}
              currentStepIndex={walkingStepProgress.currentStepIndex}
              loading={directionsLoading}
              error={directionsError}
              destinationTitle={title}
              onRetry={retryDirections}
            />
          ) : (
            <div className="cw-walking-companion__hero-layer cw-walking-companion__hero-layer--visible">
              {map}
            </div>
          )}
        </div>
      </div>

      <TransitNarrationSheet
        open={fullPlayerOpen && showMiniPlayer}
        title={trackTitle ?? title}
        narrationPlaying={narrationPlaying}
        currentTime={currentTime}
        duration={duration}
        playbackRate={playbackRate}
        transcript={transcript}
        accent={accent}
        progress={progress}
        displayTime={displayTime}
        remaining={remaining}
        onClose={() => setFullPlayerOpen(false)}
        onToggleAudio={onToggleAudio}
        onSkipBack={onSkipBack}
        onSkipForward={onSkipForward}
        onCycleSpeed={onCycleSpeed}
        onPointerDown={handleSeekPointerDown}
        onPointerMove={handleSeekPointerMove}
        onPointerUp={handleSeekPointerUp}
      />

      <footer className="cw-walking-companion__footer">
        <FloatingTransitAudioPlayer
          visible={showMiniPlayer && !fullPlayerOpen}
          title={trackTitle ?? title}
          narrationPlaying={narrationPlaying}
          currentTime={currentTime}
          duration={duration}
          accent={accent}
          onToggle={onToggleAudio}
          onOpenFullPlayer={() => setFullPlayerOpen(true)}
          className="cw-walking-companion__mini-audio"
        />

        {showArrivedUI ? (
          <div className="cw-walking-companion__dock cw-walking-companion__dock--arrived">
            {onBeginChapter ? (
              <button
                type="button"
                data-testid={beginChapterTestId}
                className="cw-walking-companion__begin-chapter cw-wc-pressable"
                onClick={() => {
                  onPrimeAudio?.()
                  onBeginChapter?.()
                }}
              >
                {beginChapterLabel}
              </button>
            ) : null}
          </div>
        ) : (
          <div className="cw-walking-companion__dock">
            {onPause ? (
              <button type="button" className="cw-walking-companion__dock-btn cw-wc-pressable" onClick={onPause}>
                Pause walk
              </button>
            ) : onContinue ? (
              <button
                type="button"
                data-testid="transit-continue"
                className="cw-walking-companion__dock-btn cw-wc-pressable"
                onClick={onContinue}
              >
                {continueLabel.replace(/\s*→\s*$/, '')}
              </button>
            ) : (
              <span className="cw-walking-companion__dock-spacer" aria-hidden />
            )}

            <button
              type="button"
              data-testid={mode === 'transit' ? 'transit-im-here' : 'manual-arrive'}
              className="cw-walking-companion__dock-btn cw-walking-companion__dock-btn--primary cw-wc-pressable"
              onClick={() => setUserConfirmedArrival(true)}
            >
              I'm here
            </button>
          </div>
        )}
      </footer>
    </div>
  )
}
