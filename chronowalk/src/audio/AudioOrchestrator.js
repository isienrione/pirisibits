const AUDIO_MODES = {
  AMBIENT: 'AMBIENT',
  TRANSIT: 'TRANSIT',
  ARRIVAL: 'ARRIVAL',
};

export const AUDIO_SYNC_EVENT = 'AUDIO_SYNC_TRIGGER';

const AUDIO_BUFFER_TIMEOUT_MS = 12000;
const VISUAL_SYNC_DELAY_MS = 250;

const normalizeAudioUrls = (audioUrls = {}) => ({
  ambient:
    audioUrls.ambient ||
    audioUrls.ambient_url ||
    null,
  transit:
    audioUrls.transit ||
    audioUrls.transit_narrative_url ||
    null,
  arrival:
    audioUrls.arrival ||
    audioUrls.arrival_immersive_url ||
    null,
});

const waitForCanPlayThrough = (player, timeoutMs = AUDIO_BUFFER_TIMEOUT_MS) =>
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
      console.warn('AudioOrchestrator: arrival track failed to buffer.');
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

class AudioOrchestrator {
  constructor() {
    this.ambientPlayer = new Audio();
    this.transitPlayer = new Audio();
    this.arrivalPlayer = new Audio();
    this.alertPlayer = new Audio();
    this.ambientPlayer.loop = true;
    this.transitPlayer.loop = true;
    this.arrivalPlayer.loop = true;
    this.alertPlayer.loop = false;
    this.currentMode = AUDIO_MODES.AMBIENT;
    this.audioUrls = normalizeAudioUrls();
    this.syncTriggerTimer = null;
    this.syncGeneration = 0;
  }

  applyAudioSources(audioUrls = {}) {
    this.audioUrls = normalizeAudioUrls(audioUrls);
  }

  clearPendingSync() {
    if (this.syncTriggerTimer) {
      clearTimeout(this.syncTriggerTimer);
      this.syncTriggerTimer = null;
    }
  }

  scheduleVisualSync(generation) {
    this.clearPendingSync();
    this.syncTriggerTimer = setTimeout(() => {
      if (generation !== this.syncGeneration) return;
      this.syncTriggerTimer = null;
      window.dispatchEvent(
        new CustomEvent(AUDIO_SYNC_EVENT, { detail: { generation } })
      );
    }, VISUAL_SYNC_DELAY_MS);
  }

  async fadeVolume(player, to, duration = 500) {
    const steps = 10;
    const stepDuration = duration / steps;
    const startVolume = player.volume;
    const delta = (to - startVolume) / steps;

    for (let i = 0; i < steps; i++) {
      player.volume = Math.min(Math.max(player.volume + delta, 0), 1);
      await new Promise((resolve) => setTimeout(resolve, stepDuration));
    }

    player.volume = to;
  }

  async playArrivalAlert(alertUrl) {
    if (!alertUrl) {
      console.warn('AudioOrchestrator: missing arrival alert URL.');
      return;
    }

    try {
      this.alertPlayer.pause();
      this.alertPlayer.currentTime = 0;
      this.alertPlayer.volume = 0.85;
      this.alertPlayer.src = alertUrl;
      await this.alertPlayer.play();
      console.log('Played GPS arrival alert');
    } catch (error) {
      console.warn('Arrival alert playback blocked.', error);
    }
  }

  async transitionToArrival({ syncVisual = false } = {}) {
    this.clearPendingSync();
    const generation = ++this.syncGeneration;

    this.ambientPlayer.pause();
    this.fadeVolume(this.transitPlayer, 0, 500);

    try {
      this.arrivalPlayer.volume = 0;
      this.arrivalPlayer.src = this.audioUrls.arrival;

      await waitForCanPlayThrough(this.arrivalPlayer);
      if (generation !== this.syncGeneration) return;

      await this.arrivalPlayer.play();
      if (generation !== this.syncGeneration) return;

      this.fadeVolume(this.arrivalPlayer, 1, 500);

      if (syncVisual) {
        this.scheduleVisualSync(generation);
      }

      console.log('Transitioning to: ARRIVAL');
    } catch (error) {
      console.warn('Audio playback blocked. User needs to interact first.', error);
    }
  }

  async transitionTo(mode, audioUrls, options = {}) {
    if (audioUrls) {
      this.applyAudioSources(audioUrls);
    }

    const targetUrl =
      mode === AUDIO_MODES.ARRIVAL
        ? this.audioUrls.arrival
        : mode === AUDIO_MODES.TRANSIT
          ? this.audioUrls.transit
          : this.audioUrls.ambient;

    if (!targetUrl) {
      console.warn(
        `AudioOrchestrator: missing audio URL for mode "${mode}". ` +
          'Check Supabase waypoints table or local seed data.'
      );
      return;
    }

    if (this.currentMode === mode && !options.syncVisual) return;

    this.currentMode = mode;

    try {
      if (mode === AUDIO_MODES.ARRIVAL) {
        await this.transitionToArrival(options);
        return;
      }

      this.clearPendingSync();

      if (mode === AUDIO_MODES.TRANSIT) {
        this.arrivalPlayer.pause();
        this.ambientPlayer.pause();
        this.transitPlayer.volume = 1;
        this.transitPlayer.src = this.audioUrls.transit;
        await this.transitPlayer.play();
      } else {
        this.transitPlayer.pause();
        this.arrivalPlayer.pause();
        this.ambientPlayer.volume = 1;
        this.ambientPlayer.src = this.audioUrls.ambient;
        await this.ambientPlayer.play();
      }

      console.log(`Transitioning to: ${mode}`);
    } catch (error) {
      console.warn('Audio playback blocked. User needs to interact first.', error);
    }
  }

  stop() {
    this.clearPendingSync();
    this.syncGeneration += 1;

    [this.ambientPlayer, this.transitPlayer, this.arrivalPlayer, this.alertPlayer].forEach((player) => {
      player.pause();
      player.currentTime = 0;
      player.volume = 1;
    });
    this.currentMode = AUDIO_MODES.AMBIENT;
  }
}

export const audioOrchestrator = new AudioOrchestrator();
export { AudioOrchestrator, AUDIO_MODES };
