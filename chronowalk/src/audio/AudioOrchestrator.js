const AUDIO_MODES = {
  AMBIENT: 'AMBIENT',
  TRANSIT: 'TRANSIT',
  ARRIVAL: 'ARRIVAL',
};

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
  }

  getPlayerForMode(mode) {
    if (mode === AUDIO_MODES.TRANSIT) return this.transitPlayer;
    if (mode === AUDIO_MODES.ARRIVAL) return this.arrivalPlayer;
    return this.ambientPlayer;
  }

  applyAudioSources(audioFiles = {}) {
    if (audioFiles.ambient_url) {
      this.ambientPlayer.src = audioFiles.ambient_url;
      this.ambientPlayer.load();
    }
    if (audioFiles.transit_narrative_url) {
      this.transitPlayer.src = audioFiles.transit_narrative_url;
      this.transitPlayer.load();
    }
    if (audioFiles.arrival_immersive_url) {
      this.arrivalPlayer.src = audioFiles.arrival_immersive_url;
      this.arrivalPlayer.load();
    }
  }

  // Orchestrates the cross-fade between states
  transitionTo(mode, audioFiles) {
    if (!Object.values(AUDIO_MODES).includes(mode)) {
      console.warn(`AudioOrchestrator: unknown mode "${mode}"`);
      return;
    }

    if (this.currentMode === mode) return;

    if (audioFiles) {
      this.applyAudioSources(audioFiles);
    }

    const fromPlayer = this.getPlayerForMode(this.currentMode);
    const toPlayer = this.getPlayerForMode(mode);
    const targetUrl = this.getUrlForMode(mode, audioFiles);

    if (!toPlayer.src && !targetUrl) {
      console.warn(`AudioOrchestrator: no audio URL for mode "${mode}"`);
      this.currentMode = mode;
      console.log(`Transitioning to: ${mode}`);
      return;
    }

    this.currentMode = mode;
    this.crossFade(fromPlayer, toPlayer);
    console.log(`Transitioning to: ${mode}`);
  }

  getUrlForMode(mode, audioFiles = {}) {
    if (mode === AUDIO_MODES.TRANSIT) return audioFiles.transit_narrative_url;
    if (mode === AUDIO_MODES.ARRIVAL) return audioFiles.arrival_immersive_url;
    return audioFiles.ambient_url;
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
