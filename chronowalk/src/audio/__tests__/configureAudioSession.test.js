import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  configurePlaybackAudioSession,
  isIOSDevice,
  primePlaybackAudioSession,
  releaseMediaChannelPlayback,
  resetAudioSessionStateForTests,
  resetMediaChannelPlayback,
  retainMediaChannelPlayback,
  supportsAudioSessionApi,
} from '../configureAudioSession';

describe('configureAudioSession', () => {
  afterEach(() => {
    resetAudioSessionStateForTests();
    vi.unstubAllGlobals();
  });

  it('sets navigator.audioSession.type to playback when supported', () => {
    const audioSession = { type: 'auto' };
    vi.stubGlobal('navigator', { audioSession, userAgent: 'iPhone', maxTouchPoints: 5 });

    expect(configurePlaybackAudioSession()).toBe(true);
    expect(audioSession.type).toBe('playback');
    expect(supportsAudioSessionApi()).toBe(true);
  });

  it('detects iOS devices', () => {
    vi.stubGlobal('navigator', { userAgent: 'iPhone', maxTouchPoints: 5, platform: 'iPhone' });
    expect(isIOSDevice()).toBe(true);
  });

  it('starts the silent keeper fallback on iOS without AudioSession', async () => {
    const play = vi.fn().mockResolvedValue(undefined);
    const pause = vi.fn();

    class AudioMock {
      constructor() {
        this.loop = false;
        this.preload = 'auto';
        this.volume = 1;
        this.currentTime = 0;
        this.play = play;
        this.pause = pause;
        this.setAttribute = vi.fn();
      }
    }

    vi.stubGlobal('navigator', { userAgent: 'iPhone', maxTouchPoints: 5, platform: 'iPhone' });
    vi.stubGlobal('Audio', AudioMock);

    await primePlaybackAudioSession();

    expect(play).toHaveBeenCalledTimes(1);
  });

  it('tracks media-channel retain and release counts', async () => {
    const play = vi.fn().mockResolvedValue(undefined);
    const pause = vi.fn();

    class AudioMock {
      constructor() {
        this.loop = false;
        this.preload = 'auto';
        this.volume = 1;
        this.currentTime = 0;
        this.play = play;
        this.pause = pause;
        this.setAttribute = vi.fn();
      }
    }

    vi.stubGlobal('navigator', { userAgent: 'iPhone', maxTouchPoints: 5, platform: 'iPhone' });
    vi.stubGlobal('Audio', AudioMock);

    retainMediaChannelPlayback();
    retainMediaChannelPlayback();
    releaseMediaChannelPlayback();
    expect(pause).not.toHaveBeenCalled();

    resetMediaChannelPlayback();
    expect(pause).toHaveBeenCalledTimes(1);
  });
});
