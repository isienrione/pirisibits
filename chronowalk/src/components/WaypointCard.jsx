import React, { useEffect, useRef, useState } from 'react';
import BeforeAfterSlider from './BeforeAfterSlider';
import { audioOrchestrator, AUDIO_MODES, AUDIO_SYNC_EVENT } from '../audio/AudioOrchestrator';
import { JOURNEY_STATE } from '../hooks/useGeoLocation';
import { requestDeviceTiltPermission } from '../hooks/useDeviceTilt';
import { getAncientSliderUrl, getModernSliderUrl, hasModernSliderMedia } from '../utils/sliderMedia';

const WaypointCard = ({ waypoint, state, onClose }) => {
  const [showSlider, setShowSlider] = useState(false);
  const [tiltEnabled, setTiltEnabled] = useState(false);
  const [entered, setEntered] = useState(false);
  const sliderRef = useRef(null);
  const syncGenerationRef = useRef(0);

  useEffect(() => {
    setShowSlider(false);
    setTiltEnabled(false);
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

  const handleStopAudio = () => {
    audioOrchestrator.stop();
  };

  const handlePlayAudio = async () => {
    if (!waypoint.arrival_immersive_url) {
      console.warn('waypoint.arrival_immersive_url is missing — check Supabase or local seed data.');
      alert('Arrival audio URL is not set for this waypoint yet.');
      return;
    }

    try {
      await audioOrchestrator.transitionTo(AUDIO_MODES.ARRIVAL, {
        transit: waypoint.transit_narrative_url,
        arrival: waypoint.arrival_immersive_url,
        ambient: waypoint.ambient_url,
      });
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

          <div className="mb-5 flex justify-center">
            <button
              type="button"
              onClick={handleStopAudio}
              className="inline-flex items-center gap-2 rounded-full border border-stone-600 bg-stone-800/80 px-4 py-2 text-xs font-medium text-stone-200 transition hover:border-amber-500/50 hover:text-amber-100"
            >
              <span aria-hidden="true">■</span>
              Stop audio
            </button>
          </div>

          {showSlider ? (
            <div ref={sliderRef} className="mb-4">
              <BeforeAfterSlider
                modernImg={getModernSliderUrl(waypoint)}
                historicImg={getAncientSliderUrl(waypoint)}
                depthMap={waypoint.depth_map_url}
                tiltEnabled={tiltEnabled}
              />
              <button
                type="button"
                onClick={() => setShowSlider(false)}
                className="mt-4 w-full text-sm font-medium text-amber-300 hover:text-amber-200"
              >
                Hide visual slider
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handlePlayAudio}
                className="flex-1 rounded-xl bg-amber-500 py-3.5 text-sm font-bold text-gray-900 shadow-lg shadow-amber-900/30 transition hover:bg-amber-400"
              >
                Play Audio Guide
              </button>
              <button
                type="button"
                onClick={startImmersive}
                className="flex-1 rounded-xl border border-amber-400/60 bg-transparent py-3.5 text-sm font-bold text-amber-100 transition hover:border-amber-300 hover:bg-amber-400/10"
              >
                Begin Immersive View
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WaypointCard;
