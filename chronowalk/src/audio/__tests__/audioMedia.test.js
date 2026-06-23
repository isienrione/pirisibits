import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  shouldPrefetchArrival,
  waitForCanPlayThrough,
  AUDIO_BUFFER_TIMEOUT_MS,
} from '../audioMedia';

const createMockPlayer = ({ readyState = 0, emitReady = true } = {}) => {
  const listeners = new Map();

  const player = {
    readyState,
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(handler);
    },
    removeEventListener(type, handler) {
      listeners.get(type)?.delete(handler);
    },
    load: vi.fn(() => {
      if (emitReady) {
        listeners.get('canplaythrough')?.forEach((handler) => handler());
      }
    }),
  };

  return { player, listeners };
};

describe('waitForCanPlayThrough', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves immediately when media is already buffered', async () => {
    const { player } = createMockPlayer({
      readyState: HTMLMediaElement.HAVE_FUTURE_DATA,
    });

    await expect(waitForCanPlayThrough(player, 1000)).resolves.toBeUndefined();
    expect(player.load).not.toHaveBeenCalled();
  });

  it('waits for canplaythrough before resolving', async () => {
    const { player } = createMockPlayer();

    const pending = waitForCanPlayThrough(player, 1000);
    await pending;

    expect(player.load).toHaveBeenCalled();
  });

  it('falls back after the buffer timeout on slow networks', async () => {
    const { player } = createMockPlayer({ emitReady: false });

    const pending = waitForCanPlayThrough(player, AUDIO_BUFFER_TIMEOUT_MS);
    vi.advanceTimersByTime(AUDIO_BUFFER_TIMEOUT_MS + 1);
    await pending;

    expect(player.load).toHaveBeenCalled();
  });
});

describe('shouldPrefetchArrival', () => {
  it('prefetches when the visitor is within the approach radius', () => {
    expect(
      shouldPrefetchArrival({
        enabled: true,
        distance: 180,
        prefetchRadiusM: 200,
      })
    ).toBe(true);
  });

  it('does not prefetch when still far away', () => {
    expect(
      shouldPrefetchArrival({
        enabled: true,
        distance: 450,
        prefetchRadiusM: 200,
      })
    ).toBe(false);
  });

  it('does not prefetch when disabled or distance is unknown', () => {
    expect(
      shouldPrefetchArrival({
        enabled: false,
        distance: 50,
        prefetchRadiusM: 200,
      })
    ).toBe(false);

    expect(
      shouldPrefetchArrival({
        enabled: true,
        distance: null,
        prefetchRadiusM: 200,
      })
    ).toBe(false);
  });
});
