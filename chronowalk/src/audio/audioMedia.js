export const AUDIO_BUFFER_TIMEOUT_MS = 12000;
export const VISUAL_SYNC_DELAY_MS = 250;
export const ARRIVAL_VOLUME = 1;
export const ARRIVAL_ALERT_VOLUME = 0.9;
export const FADE_DURATION_MS = 500;

export const normalizeAudioUrls = (audioUrls = {}) => ({
  ambient: audioUrls.ambient || audioUrls.ambient_url || null,
  transit: audioUrls.transit || audioUrls.transit_narrative_url || null,
  arrival: audioUrls.arrival || audioUrls.arrival_immersive_url || null,
});

/**
 * Wait until the media element can play through, with timeout fallback for spotty networks.
 */
export const waitForCanPlayThrough = (player, timeoutMs = AUDIO_BUFFER_TIMEOUT_MS) =>
  new Promise((resolve) => {
    if (player.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      resolve();
      return;
    }

    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      player.removeEventListener('canplaythrough', onReady);
      player.removeEventListener('error', onError);
      clearTimeout(timer);
      resolve();
    };

    const onReady = () => finish();

    const onError = () => {
      console.warn('AudioOrchestrator: track failed to buffer.');
      finish();
    };

    const timer = setTimeout(() => {
      console.warn('AudioOrchestrator: buffer timeout, syncing with best effort.');
      finish();
    }, timeoutMs);

    player.addEventListener('canplaythrough', onReady);
    player.addEventListener('error', onError);
    player.load();
  });

export const shouldPrefetchArrival = ({ enabled, distance, prefetchRadiusM }) => {
  if (!enabled) return false;
  if (distance == null || !Number.isFinite(distance)) return false;
  return distance <= prefetchRadiusM;
};
