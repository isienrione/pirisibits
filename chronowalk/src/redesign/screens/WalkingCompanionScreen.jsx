import { cloneElement, isValidElement, useCallback, useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react'
import { CheckCircle2, Footprints, Settings } from 'lucide-react'
import { T } from '../tokens.js'
import { LOCATION_STATUS } from '../../hooks/useGeoLocation.js'
import { useWalkingDirections } from '../../hooks/useWalkingDirections.js'
import { resolveWalkingStepProgress } from '../../utils/walkingStepProgress.js'
import { buildGoogleMapsDirectionsUrl } from '../../utils/walkingDirections.js'
import { pantheonNow } from '../images.js'
import FloatingTransitAudioPlayer from '../ui/FloatingTransitAudioPlayer.jsx'
import TransitNarrationSheet from '../ui/TransitNarrationSheet.jsx'
import WalkingCompanionStepsPanel from '../ui/WalkingCompanionStepsPanel.jsx'
import NextTurnsCard from '../ui/NextTurnsCard.jsx'
import { pickApproachCue } from '../lib/walkingApproachCues.js'
import {
  formatDistanceLine,
  resolveWalkChromeDistanceCopy,
} from '../lib/walkingCompanionFormat.js'
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
  onOpenSettings = null,
  extraBottomInset = 0,
  beginChapterLabel = null,
  testId = 'walking-companion-screen',
  walkingUiRev,
  /** Optional controlled Map/Steps tab — used by landing product demo storytelling. */
  forcedRouteView = null,
  /** Optional precomputed directions — skips Mapbox when provided. */
  directionsOverride = null,
  /**
   * First tour stop (Colosseum): there is no previous leg, so directions will
   * often fail. Show orienting copy instead of a scary error.
   */
  isFirstStop = false,
  /** Ride/taxi legs (e.g. Via Appia) — replaces walk distance chrome. */
  etaOverride = null,
}) {
  const [fullPlayerOpen, setFullPlayerOpen] = useState(false)
  const [userConfirmedArrival, setUserConfirmedArrival] = useState(false)
  const [dragProgress, setDragProgress] = useState(null)
  const [routeView, setRouteView] = useState('map')
  const approachCueRef = useRef(null)
  const activeRouteView = forcedRouteView === 'map' || forcedRouteView === 'steps' ? forcedRouteView : routeView

  const showArrivedUI = arrived || userConfirmedArrival
  const storyCtaLabel = beginChapterLabel || `Open the ${title} story →`

  const externalMapsUrl = useMemo(
    () => buildGoogleMapsDirectionsUrl(userPosition, destination),
    [userPosition, destination],
  )

  const liveDirections = useWalkingDirections({
    origin: userPosition,
    destination,
    legFallback,
    destinationName: title,
    enabled:
      !isFirstStop && !directionsOverride && !showArrivedUI && Boolean(destination),
  })
  const directions = isFirstStop ? null : directionsOverride ?? liveDirections.directions
  const directionsLoading =
    isFirstStop || directionsOverride ? false : liveDirections.loading
  const firstStopDirectionsCopy =
    'Once you arrive at the Colosseum, this screen will show navigation directions for the following stops.'
  const directionsError = isFirstStop
    ? firstStopDirectionsCopy
    : directionsOverride
      ? null
      : liveDirections.error
  const retryDirections = isFirstStop ? undefined : liveDirections.retry
  const mapsUrlForPanel = isFirstStop ? null : externalMapsUrl

  const handleOpenExternalMaps = useCallback((url) => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }, [])

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

  // Debounce currentStepIndex so GPS jitter doesn't cause the highlighted step
  // to flicker rapidly between adjacent steps. Only commit a new index after
  // it has been stable for ~1.2 s. The ref tracks both the pending candidate
  // and the debounce timer so they survive re-renders.
  const [stableStepIndex, setStableStepIndex] = useState(0)
  const stepDebounceRef = useRef({ timer: null, pending: 0 })

  useLayoutEffect(() => {
    // Reset immediately whenever we change stops (directions reload).
    setStableStepIndex(0)
    stepDebounceRef.current.pending = 0
    if (stepDebounceRef.current.timer !== null) {
      clearTimeout(stepDebounceRef.current.timer)
      stepDebounceRef.current.timer = null
    }
  }, [stopKey])

  useEffect(() => {
    const raw = walkingStepProgress.currentStepIndex
    if (raw === stableStepIndex) return
    stepDebounceRef.current.pending = raw
    if (stepDebounceRef.current.timer !== null) return
    stepDebounceRef.current.timer = setTimeout(() => {
      stepDebounceRef.current.timer = null
      setStableStepIndex(stepDebounceRef.current.pending)
    }, 1200)
  }, [walkingStepProgress.currentStepIndex, stableStepIndex])

  const mapWithDirections = useMemo(() => {
    if (!isValidElement(map)) return map
    const geometry = directions?.geometry ?? null
    const hasRoute = Boolean(geometry?.coordinates?.length)
    return cloneElement(map, {
      directionsGeometry: geometry,
      directionsModeActive: hasRoute,
    })
  }, [map, directions?.geometry])

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

  const distanceCopy = resolveWalkChromeDistanceCopy({
    liveDistanceM: distanceM,
    estimatedDistanceM,
    directionsDistanceM: directions?.distanceM,
    directionsDurationSec: directions?.durationSec,
    locationStatus,
    resolveWalkingDistanceCopy,
    etaOverride,
  })
  const distanceLine = formatDistanceLine(distanceCopy)
  const showGpsHelp = !showArrivedUI && distanceCopy.gpsBlocked
  const subtitleKey = showArrivedUI ? 'arrived' : approaching ? 'near' : 'walking'
  const showDistanceMeta = !showArrivedUI && !approaching

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

  const openStory = () => {
    onPrimeAudio?.()
    onBeginChapter?.()
  }

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
        {typeof onOpenSettings === 'function' ? (
          <div className="cw-walking-companion__chrome-row">
            <button
              type="button"
              className="cw-walking-companion__settings cw-wc-pressable"
              onClick={onOpenSettings}
              aria-label="Open settings"
              data-testid="walking-open-settings"
            >
              <Settings size={18} aria-hidden />
            </button>
          </div>
        ) : null}
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
            <p className="cw-walking-companion__eyebrow">Walking to</p>

            <div className="cw-walking-companion__title-row">
              <h1 className="cw-walking-companion__title">{title}</h1>
              {photo ? (
                <img className="cw-walking-companion__thumb" src={photo} alt="" />
              ) : null}
            </div>

            <div className="cw-walking-companion__subtitle" aria-live="polite">
              {showDistanceMeta ? (
                <p
                  key={subtitleKey}
                  className="cw-walking-companion__distance"
                  data-testid="walking-distance-meta"
                >
                  <Footprints
                    className="cw-walking-companion__distance-icon"
                    size={15}
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span>{distanceLine}</span>
                </p>
              ) : (
                <p
                  key={subtitleKey}
                  className={
                    approaching
                      ? 'cw-walking-companion__cue'
                      : 'cw-walking-companion__distance'
                  }
                  data-testid={approaching ? 'walking-approach-cue' : undefined}
                >
                  {approaching ? approachCue : distanceLine}
                </p>
              )}
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

      <div className="cw-walking-companion__body">
        {!showArrivedUI ? (
          <div className="cw-walking-companion__view-toggle" role="tablist" aria-label="Route view">
            <button
              type="button"
              role="tab"
              aria-selected={activeRouteView === 'map'}
              className={`cw-walking-companion__view-btn cw-wc-pressable${activeRouteView === 'map' ? ' cw-walking-companion__view-btn--active' : ''}`}
              onClick={() => setRouteView('map')}
            >
              Map
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeRouteView === 'steps'}
              className={`cw-walking-companion__view-btn cw-wc-pressable${activeRouteView === 'steps' ? ' cw-walking-companion__view-btn--active' : ''}`}
              onClick={() => setRouteView('steps')}
            >
              Steps
            </button>
          </div>
        ) : null}

        {showArrivedUI ? (
          <div className="cw-walking-companion__map-wrap cw-walking-companion__map-wrap--arrived">
            <div className="cw-walking-companion__hero-stack">
              <div className="cw-walking-companion__hero-layer cw-walking-companion__hero-layer--arrived cw-walking-companion__hero-layer--visible">
                {photo ? (
                  <img className="cw-walking-companion__arrived-photo" src={photo} alt="" />
                ) : null}
                <div className="cw-walking-companion__arrived-photo-scrim" aria-hidden />
              </div>
            </div>
          </div>
        ) : activeRouteView === 'steps' ? (
          <div className="cw-walking-companion__steps-pane">
            <WalkingCompanionStepsPanel
              steps={directions?.steps ?? []}
              currentStepIndex={stableStepIndex}
              loading={directionsLoading}
              error={directionsError}
              destinationTitle={title}
              onRetry={retryDirections}
              externalMapsUrl={mapsUrlForPanel}
              onOpenExternalMaps={handleOpenExternalMaps}
              variant="full"
            />
          </div>
        ) : (
          <>
            <div className="cw-walking-companion__map-wrap">
              <div className="cw-walking-companion__hero-stack">
                <div className="cw-walking-companion__hero-layer cw-walking-companion__hero-layer--visible">
                  {mapWithDirections}
                </div>
              </div>
            </div>
            <div className="cw-walking-companion__next-turns">
              <NextTurnsCard
                steps={directions?.steps ?? []}
                currentStepIndex={stableStepIndex}
                loading={directionsLoading}
                error={directionsError}
                destinationTitle={title}
                destinationPhoto={photo}
                onRetry={retryDirections}
                externalMapsUrl={mapsUrlForPanel}
                onOpenExternalMaps={handleOpenExternalMaps}
                maxVisible={4}
              />
            </div>
          </>
        )}
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

        {!showArrivedUI ? (
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
              className="cw-walking-companion__dock-btn cw-walking-companion__dock-btn--here cw-wc-pressable"
              onClick={() => {
                setUserConfirmedArrival(true)
                // Prefer the real arrival flow (unlock chime + You have arrived)
                // so story narration never starts from this tap alone.
                if (typeof onBeginChapter === 'function') {
                  onPrimeAudio?.()
                  onBeginChapter()
                  return
                }
              }}
            >
              I'm here
            </button>
          </div>
        ) : null}

        {onBeginChapter ? (
          <button
            type="button"
            data-testid={beginChapterTestId}
            className="cw-walking-companion__begin-chapter cw-wc-pressable"
            onClick={openStory}
          >
            {storyCtaLabel}
          </button>
        ) : null}
      </footer>
    </div>
  )
}
