import { useEffect, useRef, useState } from 'react';
import BeforeAfterSlider from './BeforeAfterSlider';
import CalibrationOverlay from './CalibrationOverlay';
import { BottomSheet, Button, GlassPanel, SectionHeader } from './ui';
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

const WaypointCard = ({ waypoint, state, onClose }) => {
  const [showSlider, setShowSlider] = useState(false);
  const [tiltEnabled, setTiltEnabled] = useState(false);
  const [alignmentMode, setAlignmentMode] = useState(false);
  const [calibration, setCalibration] = useState(() => loadCalibration(waypoint?.id));
  const [entered, setEntered] = useState(false);
  const sliderRef = useRef(null);
  const syncGenerationRef = useRef(0);
  const { isArrivalAudioPlaying, hasArrivalAudioSession } = useAudioPlaybackState();

  useEffect(() => {
    setShowSlider(false);
    setTiltEnabled(false);
    setAlignmentMode(false);
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

  const headline = waypoint.arrival_headline || `You've reached ${waypoint.title}!`;
  const subtitle =
    waypoint.arrival_subtitle || 'Prepare to step back in time and explore this landmark.';

  const handleToggleAudio = async () => {
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

  const showAudioToggle = Boolean(waypoint.arrival_immersive_url);
  const audioToggleLabel = isArrivalAudioPlaying ? 'Pause audio' : 'Play audio';
  const audioToggleIcon = isArrivalAudioPlaying ? '❚❚' : '▶';
  const debugMedia = isDebugMedia();
  const modernSliderUrl = getModernSliderUrl(waypoint);
  const ancientSliderUrl = getAncientSliderUrl(waypoint);

  return (
    <BottomSheet open={entered} onHandleClick={onClose} handleLabel="Minimize waypoint card">
      {!alignmentMode ? (
        <SectionHeader
          className="mb-6"
          eyebrow="Waypoint discovered"
          title={headline}
          subtitle={subtitle}
        />
      ) : (
        <SectionHeader
          className="mb-4"
          eyebrow="Ghost alignment"
          subtitle="Line up the semi-transparent ancient layer over the modern facade."
        />
      )}

      {showSlider ? (
        <div ref={sliderRef} className="mb-4">
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
          />
          {alignmentMode ? (
            <CalibrationOverlay
              calibration={calibration}
              onChange={setCalibration}
              onLock={handleLockAlignment}
              onReset={handleResetAlignment}
            />
          ) : null}
          <Button
            variant="ghost"
            fullWidth
            className="mt-4 rounded-full"
            onClick={() => setAlignmentMode((current) => !current)}
          >
            {alignmentMode ? 'Exit alignment mode' : 'Align ghost overlay'}
          </Button>
          {!alignmentMode ? (
            <Button
              variant="text"
              fullWidth
              className="mt-4"
              onClick={() => setShowSlider(false)}
            >
              Hide visual slider
            </Button>
          ) : null}
        </div>
      ) : (
        <>
          <GlassPanel className="mb-4 border-terracotta/20 bg-sand/40 px-4 py-3 text-center">
            <p className="text-eyebrow uppercase text-terracotta">Before you begin</p>
            <p className="mt-2 text-sm leading-relaxed text-soft-slate">
              {waypoint.immersive_orientation_hint ||
                'Stand facing the landmark facade, then begin the immersive view for the best reveal.'}
            </p>
          </GlassPanel>
          <div className="flex flex-col gap-3">
            <Button size="lg" fullWidth onClick={startImmersive}>
              Begin Immersive View
            </Button>
            <Button variant="secondary" fullWidth onClick={handlePlayAudio}>
              Play audio guide only
            </Button>
          </div>
        </>
      )}

      {showAudioToggle && !alignmentMode ? (
        <Button
          variant="secondary"
          fullWidth
          className="mt-4 rounded-full"
          onClick={handleToggleAudio}
        >
          <span aria-hidden="true">{audioToggleIcon}</span>
          {audioToggleLabel}
        </Button>
      ) : null}

      {debugMedia ? (
        <div className="mt-4 rounded-panel border border-limestone bg-deep-slate/5 p-3 text-left font-mono text-[10px] leading-relaxed text-soft-slate">
          <p className="font-semibold text-terracotta">debugMedia</p>
          <p>modern: {modernSliderUrl}</p>
          <p>ancient: {ancientSliderUrl}</p>
          <p className="mt-2 text-soft-slate/70">
            Open modern URL in a new tab — if it shows Pantheon, the file on disk or CDN is wrong.
          </p>
        </div>
      ) : null}
    </BottomSheet>
  );
};

export default WaypointCard;
