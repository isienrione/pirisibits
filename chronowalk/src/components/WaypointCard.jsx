import React, { useEffect, useRef, useState } from 'react';
import BeforeAfterSlider from './BeforeAfterSlider';
import { audioOrchestrator, AUDIO_MODES } from '../audio/AudioOrchestrator';
import { JOURNEY_STATE } from '../hooks/useGeoLocation';
import { requestDeviceTiltPermission } from '../hooks/useDeviceTilt';

const WaypointCard = ({ waypoint, state, onClose }) => {
  const [showSlider, setShowSlider] = useState(false);
  const [tiltEnabled, setTiltEnabled] = useState(false);
  const sliderRef = useRef(null);

  useEffect(() => {
    setShowSlider(false);
    setTiltEnabled(false);
  }, [waypoint?.id]);

  useEffect(() => {
    if (showSlider) {
      sliderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [showSlider]);

  if (state !== JOURNEY_STATE.ARRIVAL || !waypoint) return null;

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
    console.log('DEBUG: Button clicked, URL is:', waypoint.arrival_immersive_url);

    if (!waypoint.arrival_immersive_url) {
      console.error('CRITICAL: Waypoint audio URL is missing from database!');
      return;
    }

    if (!waypoint.modern_image_url || !waypoint.ancient_image_url) {
      alert('Image URLs missing for this waypoint.');
      return;
    }

    const tiltGranted = await requestDeviceTiltPermission();
    setTiltEnabled(tiltGranted);

    audioOrchestrator.transitionTo('ARRIVAL', {
      arrival: waypoint.arrival_immersive_url,
    });

    setShowSlider(true);
    console.log('Slider revealed. Tilt permission:', tiltGranted ? 'granted' : 'unavailable');
  };

  return (
    <div className="absolute bottom-0 left-0 z-50 h-[70vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl">
      <button
        type="button"
        onClick={onClose}
        className="mx-auto mb-4 block h-4 w-12 rounded-full bg-gray-300"
        aria-label="Minimize waypoint card"
      />
      <h2 className="text-2xl font-bold mb-2">{waypoint.title}</h2>
      <p className="text-gray-600 mb-6">You&apos;ve arrived! Prepare to step back in time.</p>

      {showSlider ? (
        <div ref={sliderRef} className="mb-4">
          <BeforeAfterSlider
            modernImg={waypoint.modern_image_url}
            historicImg={waypoint.ancient_image_url}
            depthMap={waypoint.depth_map_url}
            tiltEnabled={tiltEnabled}
          />
          <p className="mt-2 text-center text-xs text-gray-500">
            {tiltEnabled
              ? 'Tilt your phone to shift the ancient view'
              : 'Motion tilt unavailable — drag the slider to compare'}
          </p>
          <button
            type="button"
            onClick={() => setShowSlider(false)}
            className="mt-3 w-full text-sm font-medium text-blue-600"
          >
            Hide Visual Slider
          </button>
        </div>
      ) : (
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handlePlayAudio}
            className="flex-1 rounded-lg bg-blue-600 py-3 font-semibold text-white"
          >
            Play Audio Guide
          </button>
          <button
            type="button"
            onClick={startImmersive}
            className="flex-1 rounded-lg border border-blue-600 py-3 font-semibold text-blue-600"
          >
            Begin Immersive View
          </button>
        </div>
      )}
    </div>
  );
};

export default WaypointCard;
