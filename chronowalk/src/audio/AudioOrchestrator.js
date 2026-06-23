const AUDIO_MODES = {
  AMBIENT: 'AMBIENT',
  TRANSIT: 'TRANSIT',
  ARRIVAL: 'ARRIVAL',
};

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
    this.ambientPlayer.loop = true;
    this.transitPlayer.loop = true;
    this.arrivalPlayer.loop = true;
    this.currentMode = AUDIO_MODES.AMBIENT;
    this.audioUrls = normalizeAudioUrls();
  }

  applyAudioSources(audioUrls = {}) {
    this.audioUrls = normalizeAudioUrls(audioUrls);
  }

  async transitionTo(mode, audioUrls) {
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

    if (this.currentMode === mode) return;

    this.currentMode = mode;

    try {
      if (mode === AUDIO_MODES.ARRIVAL) {
        this.transitPlayer.pause();
        this.ambientPlayer.pause();
        this.arrivalPlayer.src = this.audioUrls.arrival;
        await this.arrivalPlayer.play();
      } else if (mode === AUDIO_MODES.TRANSIT) {
        this.arrivalPlayer.pause();
        this.ambientPlayer.pause();
        this.transitPlayer.src = this.audioUrls.transit;
        await this.transitPlayer.play();
      } else {
        this.transitPlayer.pause();
        this.arrivalPlayer.pause();
        this.ambientPlayer.src = this.audioUrls.ambient;
        await this.ambientPlayer.play();
      }

      console.log(`Transitioning to: ${mode}`);
    } catch (error) {
      console.warn('Audio playback blocked. User needs to interact first.', error);
    }
  }

  stop() {
    [this.ambientPlayer, this.transitPlayer, this.arrivalPlayer].forEach((player) => {
      player.pause();
      player.currentTime = 0;
    });
    this.currentMode = AUDIO_MODES.AMBIENT;
  }
}

export const audioOrchestrator = new AudioOrchestrator();
export { AudioOrchestrator, AUDIO_MODES };
