import { useEffect, useRef, useState } from 'react';
import BeforeAfterSlider from './BeforeAfterSlider';
import CalibrationOverlay from './CalibrationOverlay';
import { BottomSheet, Button, cn } from './ui';
import { audioOrchestrator, AUDIO_MODES, AUDIO_SYNC_EVENT } from '../audio/AudioOrchestrator';
import { useAudioPlaybackState } from '../hooks/useAudioPlaybackState';
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
  getModernPosterUrl,
  getModernSliderUrl,
  hasModernSliderMedia,
} from '../utils/sliderMedia';
import { isDebugMedia } from '../config/env';

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
            className="absolute inset-0 bg-gradient-to-t from-deep-slate/50 via-deep-slate/10 to-transparent"
            aria-hidden="true"
          />
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center px-8 text-center">
          {status === 'loading' ? (
            <>
              <div
                className="mb-4 h-10 w-10 animate-pulse rounded-full bg-gold/30"
                aria-hidden="true"
              />
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

function WaypointCardBody({
  eyebrow,
  title,
  hook,
  orientationHint,
  children,
  className,
}) {
  return (
    <div className={cn('px-6', className)}>
      <p className="text-eyebrow uppercase text-terracotta">{eyebrow}</p>
      <h2 className="mt-2 font-display text-3xl font-semibold leading-tight tracking-tight text-deep-slate">
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

const WaypointCard = ({ waypoint, state, onClose }) => {
  const [showSlider, setShowSlider] = useState(false);
  const [tiltEnabled, setTiltEnabled] = useState(false);
  const [alignmentMode, setAlignmentMode] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [calibration, setCalibration] = useState(() => loadCalibration(waypoint?.id));
  const [entered, setEntered] = useState(false);
  const sliderRef = useRef(null);
  const syncGenerationRef = useRef(0);
  const { isArrivalAudioPlaying, hasArrivalAudioSession } = useAudioPlaybackState();

  const modernSliderUrl = waypoint ? getModernSliderUrl(waypoint) : null;
  const ancientSliderUrl = waypoint ? getAncientSliderUrl(waypoint) : null;
  const heroPreviewUrl =
    (waypoint && (getModernPosterUrl(waypoint) || getModernSliderUrl(waypoint))) ?? null;
  const heroStatus = useMediaHeroState(heroPreviewUrl);
  const hasModernMedia = waypoint ? hasModernSliderMedia(waypoint) : false;
  const debugMedia = isDebugMedia();

  useEffect(() => {
    setShowSlider(false);
    setTiltEnabled(false);
    setAlignmentMode(false);
    setAdvancedOpen(false);
    setCalibration(loadCalibration(waypoint?.id));
    setEntered(false);
    syncGenerationRef.current = 0;
  }, [waypoint?.id]);

  useEffect(() => {
    if (!waypoint) return undefined;
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, [waypoint]);

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
      sliderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [showSlider]);

  useEffect(() => {
    if (!alignmentMode) return undefined;

    const timer = window.setTimeout(() => {
      sliderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [alignmentMode]);

  if (state !== JOURNEY_STATE.ARRIVAL || !waypoint) return null;

  const landmarkTitle = waypoint.title;
  const narrativeHook =
    waypoint.arrival_subtitle || 'A new chapter of the city opens beneath your feet.';
  const orientationHint =
    !showSlider && !alignmentMode
      ? waypoint.immersive_orientation_hint ||
        'Stand facing the landmark facade for the most immersive reveal.'
      : null;

  const handlePlayAudio = async () => {
    if (!waypoint.arrival_immersive_url) {
      console.warn('waypoint.arrival_immersive_url is missing — check Supabase or local seed data.');
      alert('Arrival audio URL is not set for this waypoint yet.');
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
    } catch (err) {
      console.error('Failed to play audio guide:', err);
    }
  };

  const startImmersive = async () => {
    if (!waypoint.arrival_immersive_url) {
      console.error('CRITICAL: Waypoint audio URL is missing from database!');
      return;
    }

    if (!hasModernSliderMedia(waypoint)) {
      alert('Modern view media is missing for this waypoint.');
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

  const audioButtonLabel = isArrivalAudioPlaying
    ? 'Pause audio story'
    : hasArrivalAudioSession
      ? 'Resume audio story'
      : 'Start audio story';

  const handleAudioAction = async () => {
    if (isArrivalAudioPlaying) {
      audioOrchestrator.pauseArrival();
      return;
    }
    if (hasArrivalAudioSession) {
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
      : "You've arrived";

  const advancedSection = (
    <details
      className="mt-6 border-t border-limestone/60 pt-4"
      open={advancedOpen}
      onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}
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
            onClick={() => setShowSlider(true)}
          >
            Open comparison preview
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
      onHandleClick={onClose}
      handleLabel="Minimize landmark card"
    >
      {showSlider ? (
        <div ref={sliderRef} className="mb-5">
          <div className="overflow-hidden rounded-b-3xl shadow-glass-lg">
            <BeforeAfterSlider
              key={`${waypoint.id}-${waypoint.media_cache_version ?? 1}`}
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
            />
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
        eyebrow={eyebrow}
        title={landmarkTitle}
        hook={!alignmentMode ? narrativeHook : 'Line up the ancient layer over the modern facade.'}
        orientationHint={orientationHint}
        className="pb-6"
      >
        {!showSlider && !alignmentMode ? (
          <div className="mt-6 flex flex-col gap-3">
            <Button size="lg" fullWidth className="rounded-2xl" onClick={startImmersive}>
              Reveal ancient view
            </Button>
            {hasModernMedia ? (
              <Button
                variant="secondary"
                fullWidth
                className="rounded-2xl"
                onClick={() => setShowSlider(true)}
              >
                Compare then &amp; now
              </Button>
            ) : null}
          </div>
        ) : showSlider && !alignmentMode ? (
          <div className="mt-5">
            <p className="text-sm text-soft-slate">
              Drag across the facade to travel between eras. Audio continues as you explore.
            </p>
          </div>
        ) : null}

        {showAudioControl ? (
          <div className="mt-4">
            <Button
              variant={showSlider ? 'primary' : 'secondary'}
              fullWidth
              className="rounded-2xl"
              onClick={handleAudioAction}
            >
              {audioButtonLabel}
            </Button>
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
