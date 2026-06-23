import React, { useEffect, useRef, useState } from 'react';
import BeforeAfterSlider from './BeforeAfterSlider';
import CalibrationOverlay from './CalibrationOverlay';
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

  return (
    <div
      className={`absolute bottom-0 left-0 z-50 w-full transform transition-transform duration-500 ease-out ${
        entered ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="mx-auto max-h-[78vh] overflow-hidden rounded-t-[2rem] border border-amber-200/30 bg-gradient-to-b from-gray-900 via-gray-900 to-stone-900 shadow-[0_-12px_40px_rgba(0,0,0,0.45)]">
        <div className="flex items-center justify-between px-5 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="mx-auto h-1.5 w-14 rounded-full bg-amber-300/40"
            aria-label="Minimize waypoint card"
          />
        </div>

        <div className="overflow-y-auto px-6 pb-8 pt-2">
          <div className="mb-6 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
              Waypoint discovered
            </p>
            <h2 className="font-serif text-3xl font-bold leading-tight text-amber-50">
              {headline}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-stone-300">{subtitle}</p>
          </div>

          {showSlider ? (
            <div ref={sliderRef} className="mb-4">
              <BeforeAfterSlider
                modernImg={getModernSliderUrl(waypoint)}
                historicImg={getAncientSliderUrl(waypoint)}
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
              <button
                type="button"
                onClick={() => setAlignmentMode((current) => !current)}
                className="mt-4 w-full rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-400/20"
              >
                {alignmentMode ? 'Exit alignment mode' : 'Align ghost overlay'}
              </button>
              {alignmentMode ? (
                <CalibrationOverlay
                  calibration={calibration}
                  onChange={setCalibration}
                  onLock={handleLockAlignment}
                  onReset={handleResetAlignment}
                />
              ) : null}
              <button
                type="button"
                onClick={() => setShowSlider(false)}
                className="mt-4 w-full text-sm font-medium text-amber-300 hover:text-amber-200"
              >
                Hide visual slider
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4 rounded-xl border border-amber-400/25 bg-amber-400/5 px-4 py-3 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">
                  Before you begin
                </p>
                <p className="mt-2 text-sm leading-relaxed text-stone-300">
                  {waypoint.immersive_orientation_hint ||
                    'Stand facing the landmark facade, then begin the immersive view for the best reveal.'}
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={startImmersive}
                  className="w-full rounded-xl bg-amber-500 py-4 text-base font-bold text-gray-900 shadow-lg shadow-amber-900/30 transition hover:bg-amber-400"
                >
                  Begin Immersive View
                </button>
                <button
                  type="button"
                  onClick={handlePlayAudio}
                  className="w-full rounded-xl border border-stone-600 bg-stone-800/50 py-3 text-sm font-medium text-stone-300 transition hover:border-amber-400/40 hover:text-amber-100"
                >
                  Play audio guide only
                </button>
              </div>
            </>
          )}

          {showAudioToggle ? (
            <button
              type="button"
              onClick={handleToggleAudio}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-stone-600 bg-stone-800/80 px-4 py-3 text-sm font-medium text-stone-200 transition hover:border-amber-500/50 hover:text-amber-100"
            >
              <span aria-hidden="true">{audioToggleIcon}</span>
              {audioToggleLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default WaypointCard;
