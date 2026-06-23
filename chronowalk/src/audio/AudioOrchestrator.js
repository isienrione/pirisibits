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
    this.fadeDurationMs = 2000;
    this.fadeFrame = null;
    this.audioUrls = normalizeAudioUrls();
  }

  getPlayerForMode(mode) {
    if (mode === AUDIO_MODES.TRANSIT) return this.transitPlayer;
    if (mode === AUDIO_MODES.ARRIVAL) return this.arrivalPlayer;
    return this.ambientPlayer;
  }

  applyAudioSources(audioUrls = {}) {
    this.audioUrls = normalizeAudioUrls(audioUrls);

    if (this.audioUrls.ambient) {
      this.ambientPlayer.src = this.audioUrls.ambient;
      this.ambientPlayer.load();
    }
    if (this.audioUrls.transit) {
      this.transitPlayer.src = this.audioUrls.transit;
      this.transitPlayer.load();
    }
    if (this.audioUrls.arrival) {
      this.arrivalPlayer.src = this.audioUrls.arrival;
      this.arrivalPlayer.load();
    }
  }

  // Orchestrates the cross-fade between states
  transitionTo(mode, audioUrls) {
    if (!Object.values(AUDIO_MODES).includes(mode)) {
      console.warn(`AudioOrchestrator: unknown mode "${mode}"`);
      return;
    }

    if (audioUrls) {
      this.applyAudioSources(audioUrls);
    }

    if (this.currentMode === mode) return;

    const fromPlayer = this.getPlayerForMode(this.currentMode);
    const toPlayer = this.getPlayerForMode(mode);

    if (mode === AUDIO_MODES.ARRIVAL) {
      this.transitPlayer.pause();
      if (this.audioUrls.arrival) {
        this.arrivalPlayer.src = this.audioUrls.arrival;
      }
    } else if (mode === AUDIO_MODES.TRANSIT) {
      this.arrivalPlayer.pause();
      if (this.audioUrls.transit) {
        this.transitPlayer.src = this.audioUrls.transit;
      }
    } else {
      this.transitPlayer.pause();
      this.arrivalPlayer.pause();
      if (this.audioUrls.ambient) {
        this.ambientPlayer.src = this.audioUrls.ambient;
      }
    }

    const targetUrl =
      mode === AUDIO_MODES.ARRIVAL
        ? this.audioUrls.arrival
        : mode === AUDIO_MODES.TRANSIT
          ? this.audioUrls.transit
          : this.audioUrls.ambient;

    if (!targetUrl && !toPlayer.src) {
      console.warn(`AudioOrchestrator: no audio URL for mode "${mode}"`);
      this.currentMode = mode;
      console.log(`Transitioning to: ${mode}`);
      return;
    }

    this.currentMode = mode;
    this.crossFade(fromPlayer, toPlayer);
    console.log(`Transitioning to: ${mode}`);
  }

  crossFade(fromPlayer, toPlayer) {
    this.cancelFade();

    toPlayer.volume = 0;
    toPlayer.play().catch((err) => console.error('Audio playback failed:', err));

    const start = performance.now();
    const fromStartVolume = fromPlayer.paused ? 0 : fromPlayer.volume;

    const step = (now) => {
      const progress = Math.min((now - start) / this.fadeDurationMs, 1);

      if (!fromPlayer.paused) {
        fromPlayer.volume = fromStartVolume * (1 - progress);
      }
      toPlayer.volume = progress;

      if (progress < 1) {
        this.fadeFrame = requestAnimationFrame(step);
        return;
      }

      fromPlayer.pause();
      fromPlayer.currentTime = 0;
      fromPlayer.volume = 0;
      toPlayer.volume = 1;
      this.fadeFrame = null;
    };

    this.fadeFrame = requestAnimationFrame(step);
  }

  cancelFade() {
    if (this.fadeFrame) {
      cancelAnimationFrame(this.fadeFrame);
      this.fadeFrame = null;
    }
  }

  stop() {
    this.cancelFade();
    [this.ambientPlayer, this.transitPlayer, this.arrivalPlayer].forEach((player) => {
      player.pause();
      player.currentTime = 0;
      player.volume = 0;
    });
    this.currentMode = AUDIO_MODES.AMBIENT;
  }
}

export const audioOrchestrator = new AudioOrchestrator();
export { AudioOrchestrator, AUDIO_MODES };
