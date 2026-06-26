import { useEffect, useId, useRef, useState, lazy, Suspense } from 'react';
import CalibrationOverlay from './CalibrationOverlay';
import AudioPlayerPanel from './AudioPlayerPanel';
import ErrorBoundary from './ErrorBoundary';
import { BottomSheet, Button, LoadingPanel, LoadingSpinner, cn, ctaInCard, motionUnlockGlow } from './ui';
import { audioOrchestrator, AUDIO_MODES, AUDIO_SYNC_EVENT } from '../audio/AudioOrchestrator';
import { useAudioPlaybackState } from '../hooks/useAudioPlaybackState';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useOpenHaptic } from '../hooks/useHapticTriggers';
import { HAPTIC_KIND, triggerHaptic } from '../utils/haptics';
import { JOURNEY_STATE } from '../hooks/useGeoLocation';
import { requestDeviceTiltPermission } from '../hooks/useDeviceTilt';
import {
  loadCalibration,
  resetCalibration,
  saveCalibration,
} from '../utils/calibrationStorage';
import {
  getAncientPosterUrl,
  getAncientSliderUrl,
  getModernCoverUrl,
  getModernPosterUrl,
  getModernSliderUrl,
  hasModernSliderMedia,
} from '../utils/sliderMedia';
import { isDebugMedia } from '../config/env';

const BeforeAfterSlider = lazy(() => import('./BeforeAfterSlider'));

const useMediaHeroState = (url) => {
  const [status, setStatus] = useState(url ? 'loading' : 'empty');

  useEffect(() => {
    if (!url) {
      setStatus('empty');
      return undefined;
    }

    let cancelled = false;
    setStatus('loading');

    const image = new Image();
    image.onload = () => {
      if (!cancelled) setStatus('ready');
    };
    image.onerror = () => {
      if (!cancelled) setStatus('error');
    };
    image.referrerPolicy = 'no-referrer';
    image.src = url;

    return () => {
      cancelled = true;
    };
  }, [url]);

  return status;
};

function WaypointMediaHero({ previewUrl, status, landmarkTitle }) {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-sand via-limestone/40 to-warm-white sm:aspect-[16/10]">
      {status === 'ready' && previewUrl ? (
        <>
          <img
            src={previewUrl}
            alt=""
            className="h-full w-full object-cover object-center"
            referrerPolicy="no-referrer"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-deep-slate/70 via-deep-slate/25 to-deep-slate/5"
            aria-hidden="true"
          />
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center px-8 text-center">
          {status === 'loading' ? (
            <>
              <LoadingSpinner className="mb-4" />
              <p className="text-sm font-medium text-deep-slate">Loading landmark view…</p>
            </>
          ) : status === 'error' ? (
            <>
              <p className="font-display text-lg font-semibold text-deep-slate">
                Preview unavailable
              </p>
              <p className="mt-2 max-w-xs text-sm text-soft-slate">
                We couldn&apos;t load the modern view for {landmarkTitle}. You can still start the
                audio story below.
              </p>
            </>
          ) : (
            <>
              <p className="font-display text-lg font-semibold text-deep-slate">View coming soon</p>
              <p className="mt-2 max-w-xs text-sm text-soft-slate">
                The visual reconstruction for {landmarkTitle} is being prepared. The audio story is
                ready when you are.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AudioTranscriptSection({ waypoint }) {
  const transcript =
    waypoint?.arrival_transcript ||
    waypoint?.arrival_subtitle ||
    'Full captions and transcript will appear here as audio stories are published for this landmark.';

  return (
    <details className="mt-4 rounded-2xl border border-limestone/70 bg-sand/30 px-4 py-3">
      <summary className="cursor-pointer text-sm font-semibold text-deep-slate">
        Captions &amp; transcript
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-soft-slate">{transcript}</p>
      {!waypoint?.arrival_transcript ? (
        <p className="mt-2 text-xs text-soft-slate/80">
          Placeholder — timed captions will sync with narration in a future update.
        </p>
      ) : null}
    </details>
  );
}

function WaypointCardBody({
  titleId,
  eyebrow,
  title,
  hook,
  orientationHint,
  titleHighlight = false,
  reducedMotion = false,
  children,
  className,
}) {
  return (
    <div className={cn('px-6', className)}>
      <p className="text-eyebrow uppercase text-gold">{eyebrow}</p>
      <h2
        id={titleId}
        className={cn(
          'mt-2 font-display text-3xl font-semibold leading-tight tracking-tight text-deep-slate',
          titleHighlight && !reducedMotion && motionUnlockGlow
        )}
      >
        {title}
      </h2>
      {hook ? (
        <p className="mt-3 text-base leading-relaxed text-soft-slate">{hook}</p>
      ) : null}
      {orientationHint ? (
        <p className="mt-4 rounded-2xl border border-limestone/70 bg-sand/50 px-4 py-3 text-sm leading-relaxed text-soft-slate">
          {orientationHint}
        </p>
      ) : null}
      {children}
    </div>
  );
}

const WaypointCard = ({ waypoint, state, onClose, isFreshArrival = false, accessMode = 'arrival' }) => {
  const titleId = useId();
  const reducedMotion = useReducedMotion();
  const [showSlider, setShowSlider] = useState(false);
  const [tiltEnabled, setTiltEnabled] = useState(false);
  const [alignmentMode, setAlignmentMode] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [mediaError, setMediaError] = useState(null);
  const [calibration, setCalibration] = useState(() => loadCalibration(waypoint?.id));
  const [entered, setEntered] = useState(false);
  const sliderRef = useRef(null);
  const syncGenerationRef = useRef(0);
  const { isArrivalAudioPlaying, hasArrivalAudioSession, needsResumeAudio } =
    useAudioPlaybackState();

  const modernSliderUrl = waypoint ? getModernSliderUrl(waypoint) : null;
  const ancientSliderUrl = waypoint ? getAncientSliderUrl(waypoint) : null;
  const heroPreviewUrl =
    (waypoint && (getModernCoverUrl(waypoint) || getModernSliderUrl(waypoint))) ?? null;
  const heroStatus = useMediaHeroState(heroPreviewUrl);
  const hasModernMedia = waypoint ? hasModernSliderMedia(waypoint) : false;
  const debugMedia = isDebugMedia();

  useEffect(() => {
    setShowSlider(false);
    setTiltEnabled(false);
    setAlignmentMode(false);
    setAdvancedOpen(false);
    setMediaError(null);
    setCalibration(loadCalibration(waypoint?.id));
    setEntered(false);
    syncGenerationRef.current = 0;
  }, [waypoint?.id]);

  useEffect(() => {
    if (!waypoint) return undefined;
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, [waypoint]);

  useOpenHaptic(showSlider);

  useEffect(() => {
    const onAudioSync = (event) => {
      const generation = event.detail?.generation;
      if (generation != null && generation < syncGenerationRef.current) return;
      if (generation != null) syncGenerationRef.current = generation;
      setShowSlider(true);
    };
    window.addEventListener(AUDIO_SYNC_EVENT, onAudioSync);
    return () => window.removeEventListener(AUDIO_SYNC_EVENT, onAudioSync);
  }, []);

  useEffect(() => {
    if (showSlider) {
      sliderRef.current?.scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'nearest',
      });
    }
  }, [showSlider, reducedMotion]);

  useEffect(() => {
    if (!alignmentMode) return undefined;

    const timer = window.setTimeout(() => {
      sliderRef.current?.scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [alignmentMode, reducedMotion]);

  if (!waypoint) return null;
  if (accessMode !== 'remote' && state !== JOURNEY_STATE.ARRIVAL) return null;

  const landmarkTitle = waypoint.title;
  const narrativeHook =
    waypoint.arrival_subtitle || 'A new chapter of the city opens beneath your feet.';
  const orientationHint =
    !showSlider && !alignmentMode
      ? waypoint.immersive_orientation_hint ||
        'Stand facing the landmark facade for the most immersive reveal.'
      : null;

  const handlePlayAudio = async () => {
    setMediaError(null);

    if (!waypoint.arrival_immersive_url) {
      setMediaError('Arrival audio is not available for this landmark yet.');
      return;
    }

    try {
      await audioOrchestrator.transitionTo(
        AUDIO_MODES.ARRIVAL,
        {
          transit: waypoint.transit_narrative_url,
          arrival: waypoint.arrival_immersive_url,
          ambient: waypoint.ambient_url,
        },
        { force: true }
      );
      triggerHaptic(HAPTIC_KIND.SUCCESS);
    } catch (err) {
      console.error('Failed to play audio guide:', err);
      setMediaError('Could not start audio. Tap again or check your connection.');
    }
  };

  const startTimePortal = async () => {
    setMediaError(null);

    if (!waypoint.arrival_immersive_url) {
      setMediaError('Arrival audio is not available for this landmark yet.');
      return;
    }

    if (!hasModernSliderMedia(waypoint)) {
      setMediaError('Modern view media is missing for this waypoint.');
      return;
    }

    const tiltGranted = await requestDeviceTiltPermission();
    setTiltEnabled(tiltGranted);

    audioOrchestrator.transitionTo(
      AUDIO_MODES.ARRIVAL,
      {
        transit: waypoint.transit_narrative_url,
        arrival: waypoint.arrival_immersive_url,
        ambient: waypoint.ambient_url,
      },
      { syncVisual: true }
    );
  };

  const openImageOnly = () => {
    setMediaError(null);
    if (!hasModernSliderMedia(waypoint)) {
      setMediaError('Comparison media is not available for this landmark yet.');
      return;
    }
    setShowSlider(true);
  };

  const exitCompareView = () => {
    setShowSlider(false);
    setAlignmentMode(false);
  };

  const openAudioOnly = async () => {
    setShowSlider(false);
    await handlePlayAudio();
  };

  const handleLockAlignment = () => {
    if (!waypoint?.id) return;
    saveCalibration(waypoint.id, calibration);
    setAlignmentMode(false);
  };

  const handleResetAlignment = () => {
    if (!waypoint?.id) return;
    const defaults = resetCalibration(waypoint.id);
    setCalibration(defaults);
  };

  const handleAudioAction = async () => {
    if (isArrivalAudioPlaying) {
      audioOrchestrator.pauseArrival();
      return;
    }
    if (needsResumeAudio || hasArrivalAudioSession) {
      const resumed = await audioOrchestrator.resumeArrival();
      if (resumed) return;
    }
    await handlePlayAudio();
  };

  const showAudioControl = Boolean(waypoint.arrival_immersive_url) && !alignmentMode;

  const eyebrow = alignmentMode
    ? 'Fine-tuning view'
    : showSlider
      ? 'Then & now'
      : accessMode === 'remote'
        ? 'Remote preview'
        : isFreshArrival
          ? 'Waypoint discovered'
          : "You've arrived";

  const advancedSection = (
    <details
      className="mt-6 border-t border-limestone/60 pt-4"
      open={advancedOpen}
      onToggle={(event) => {
        const nextOpen = event.currentTarget.open;
        setAdvancedOpen(nextOpen);
        if (nextOpen) triggerHaptic(HAPTIC_KIND.SOFT_TAP);
      }}
    >
      <summary className="cursor-pointer text-sm font-semibold text-soft-slate transition hover:text-deep-slate">
        Advanced
      </summary>
      <div className="mt-4 space-y-3">
        {showSlider ? (
          <>
            <Button
              variant="ghost"
              fullWidth
              className="rounded-2xl"
              onClick={() => {
                setAlignmentMode((current) => !current);
                if (!advancedOpen) setAdvancedOpen(true);
              }}
            >
              {alignmentMode ? 'Exit ghost alignment' : 'Align ghost overlay'}
            </Button>
            {alignmentMode ? (
              <CalibrationOverlay
                calibration={calibration}
                onChange={setCalibration}
                onLock={handleLockAlignment}
                onReset={handleResetAlignment}
              />
            ) : null}
            {!alignmentMode ? (
              <Button
                variant="text"
                fullWidth
                onClick={() => setShowSlider(false)}
              >
                Hide comparison
              </Button>
            ) : null}
          </>
        ) : hasModernMedia ? (
          <Button
            variant="ghost"
            fullWidth
            className="rounded-2xl"
            onClick={openImageOnly}
          >
            Open comparison
          </Button>
        ) : null}

        {debugMedia ? (
          <div className="rounded-2xl border border-limestone bg-deep-slate/5 p-3 text-left font-mono text-[10px] leading-relaxed text-soft-slate">
            <p className="font-semibold text-terracotta">Media diagnostics</p>
            <p>modern: {modernSliderUrl}</p>
            <p>ancient: {ancientSliderUrl}</p>
          </div>
        ) : null}
      </div>
    </details>
  );

  return (
    <BottomSheet
      open={entered}
      flush
      cinematic
      onHandleClick={onClose}
      onEscape={onClose}
      handleLabel="Minimize landmark card"
      ariaLabelledBy={titleId}
    >
      {showSlider ? (
        <div ref={sliderRef} className="mb-5 touch-none" onTouchMove={(event) => event.stopPropagation()}>
          <div className="overflow-hidden rounded-b-3xl shadow-glass-lg">
            <ErrorBoundary
              title="Comparison view unavailable"
              message="The then-and-now slider could not load. You can still listen to the audio story below."
            >
              <Suspense
                fallback={
                  <LoadingPanel
                    label="Loading comparison…"
                    hint="Preparing matched modern and ancient views"
                    className="min-h-[14rem] rounded-b-3xl"
                  />
                }
              >
                <BeforeAfterSlider
                  key={`${waypoint.id}-${waypoint.media_cache_version ?? 1}`}
                  embedded
                  modernImg={modernSliderUrl}
                  historicImg={ancientSliderUrl}
                  depthMap={waypoint.depth_map_url}
                  tiltEnabled={tiltEnabled}
                  posterAtSec={waypoint.slider_poster_at_sec ?? waypoint.slider_freeze_at_sec}
                  postAnimationLoopMs={
                    waypoint.slider_post_animation_loop_ms ?? waypoint.slider_poster_hold_ms
                  }
                  modernPosterUrl={getModernPosterUrl(waypoint)}
                  ancientPosterUrl={getAncientPosterUrl(waypoint)}
                  calibration={calibration}
                  alignmentMode={alignmentMode}
                  maxFrameHeightRatio={0.62}
                  onRequestExit={exitCompareView}
                />
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
      ) : (
        <WaypointMediaHero
          previewUrl={heroPreviewUrl}
          status={heroStatus}
          landmarkTitle={landmarkTitle}
        />
      )}

      <WaypointCardBody
        titleId={titleId}
        eyebrow={eyebrow}
        title={landmarkTitle}
        hook={!alignmentMode ? narrativeHook : 'Line up the ancient layer over the modern facade.'}
        orientationHint={orientationHint}
        titleHighlight={isFreshArrival && !showSlider && !alignmentMode}
        reducedMotion={reducedMotion}
        className="pb-6"
      >
        {mediaError ? (
          <p className="mt-4 rounded-2xl border border-terracotta/30 bg-terracotta/10 px-4 py-3 text-sm text-deep-slate" role="alert">
            {mediaError}
          </p>
        ) : null}

        {accessMode === 'remote' ? (
          <p className="mt-4 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm leading-relaxed text-deep-slate">
            You are viewing this landmark remotely. Visit on foot for the full GPS-guided arrival
            experience.
          </p>
        ) : null}

        {!showSlider && !alignmentMode ? (
          <div className="mt-6 space-y-3">
            {hasModernMedia ? (
              <Button size="lg" fullWidth onClick={startTimePortal}>
                Step through time
              </Button>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              {hasModernMedia ? (
                <Button variant="secondary" fullWidth className={ctaInCard} onClick={openImageOnly}>
                  Image only
                </Button>
              ) : null}
              {waypoint.arrival_immersive_url ? (
                <Button
                  variant="secondary"
                  fullWidth
                  className={ctaInCard}
                  onClick={openAudioOnly}
                >
                  Audio only
                </Button>
              ) : null}
            </div>
          </div>
        ) : showSlider && !alignmentMode ? (
          <div className="mt-5">
            <p className="text-sm text-soft-slate">
              Drag across the facade to travel between eras. Audio continues as you explore.
            </p>
          </div>
        ) : null}

        {showAudioControl ? (
          <div className="mt-4 space-y-3">
            <AudioPlayerPanel
              title={landmarkTitle}
              subtitle={waypoint.arrival_subtitle}
              isPlaying={isArrivalAudioPlaying}
              posterUrl={heroPreviewUrl}
              onToggle={handleAudioAction}
              onStop={() => audioOrchestrator.stop()}
            />
            {needsResumeAudio ? (
              <p className="text-xs text-soft-slate">
                Audio was interrupted — tap play to continue the story.
              </p>
            ) : null}
            <AudioTranscriptSection waypoint={waypoint} />
          </div>
        ) : null}

        <div className="mt-4 flex flex-col gap-2">
          <Button variant="text" fullWidth onClick={onClose}>
            Continue walking
          </Button>
        </div>

        {advancedSection}
      </WaypointCardBody>
    </BottomSheet>
  );
};

export default WaypointCard;
