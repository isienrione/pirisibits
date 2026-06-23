import { JOURNEY_STATE } from '../hooks/useGeoLocation';

export class AudioOrchestrator {
  constructor({ fadeDurationMs = 2000 } = {}) {
    this.fadeDurationMs = fadeDurationMs;
    this.transitAudio = new Audio();
    this.arrivalAudio = new Audio();
    this.transitAudio.loop = true;
    this.arrivalAudio.loop = true;
    this.currentTrack = null;
    this.fadeFrame = null;
    this.isLoaded = false;
  }

  load({ transit_narrative_url, arrival_immersive_url }) {
    if (!transit_narrative_url || !arrival_immersive_url) {
      console.warn('AudioOrchestrator: missing narrative audio URLs');
      this.isLoaded = false;
      return;
    }

    this.transitAudio.src = transit_narrative_url;
    this.arrivalAudio.src = arrival_immersive_url;
    this.transitAudio.load();
    this.arrivalAudio.load();
    this.isLoaded = true;
  }

  syncToJourneyState(status) {
    if (!this.isLoaded || !status) return;

    if (status === JOURNEY_STATE.TRANSIT) {
      this.crossFadeTo('transit');
      return;
    }

    if (status === JOURNEY_STATE.ARRIVAL) {
      this.crossFadeTo('arrival');
    }
  }

  crossFadeTo(target) {
    if (this.currentTrack === target) return;

    const fromAudio =
      this.currentTrack === 'arrival' ? this.arrivalAudio : this.transitAudio;
    const toAudio =
      target === 'arrival' ? this.arrivalAudio : this.transitAudio;

    this.currentTrack = target;
    this.cancelFade();

    toAudio.volume = 0;
    toAudio.play().catch((err) => console.error('Audio playback failed:', err));

    const start = performance.now();
    const fromStartVolume = fromAudio.volume;

    const step = (now) => {
      const progress = Math.min((now - start) / this.fadeDurationMs, 1);

      fromAudio.volume = fromStartVolume * (1 - progress);
      toAudio.volume = progress;

      if (progress < 1) {
        this.fadeFrame = requestAnimationFrame(step);
        return;
      }

      fromAudio.pause();
      fromAudio.currentTime = 0;
      fromAudio.volume = 0;
      toAudio.volume = 1;
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
    this.transitAudio.pause();
    this.arrivalAudio.pause();
    this.transitAudio.currentTime = 0;
    this.arrivalAudio.currentTime = 0;
    this.transitAudio.volume = 0;
    this.arrivalAudio.volume = 0;
    this.currentTrack = null;
  }

  destroy() {
    this.stop();
    this.transitAudio.src = '';
    this.arrivalAudio.src = '';
    this.isLoaded = false;
  }
}
