const AUDIO_MODES = {
  AMBIENT: 'AMBIENT',
  TRANSIT: 'TRANSIT',
  ARRIVAL: 'ARRIVAL',
};

export const AUDIO_SYNC_EVENT = 'AUDIO_SYNC_TRIGGER';

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
  }

  applyAudioSources(audioUrls = {}) {
    this.audioUrls = normalizeAudioUrls(audioUrls);
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
    this.ambientPlayer.pause();

    // 1. Start fading out transit
    this.fadeVolume(this.transitPlayer, 0, 500);

    // 2. Schedule the visual trigger at 250ms
    if (syncVisual) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent(AUDIO_SYNC_EVENT));
      }, 250);
    }

    // 3. Start arrival player
    try {
      this.arrivalPlayer.volume = 0;
      this.arrivalPlayer.src = this.audioUrls.arrival;
      await this.arrivalPlayer.play();
      this.fadeVolume(this.arrivalPlayer, 1, 500);
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
