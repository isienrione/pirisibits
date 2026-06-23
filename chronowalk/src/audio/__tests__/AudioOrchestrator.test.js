import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { AudioOrchestrator, AUDIO_MODES, AUDIO_SYNC_EVENT } from '../AudioOrchestrator';
import { VISUAL_SYNC_DELAY_MS, FADE_DURATION_MS } from '../audioMedia';

const createMockAudio = () => ({
  loop: false,
  paused: true,
  volume: 1,
  currentTime: 0,
  readyState: HTMLMediaElement.HAVE_ENOUGH_DATA,
  src: '',
  preload: 'auto',
  play: vi.fn(async function play() {
    this.paused = false;
  }),
  pause: vi.fn(function pause() {
    this.paused = true;
  }),
  load: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
});

describe('AudioOrchestrator', () => {
  let dispatchedEvents;
  let windowRef;

  beforeEach(() => {
    vi.useFakeTimers();
    dispatchedEvents = [];

    windowRef = {
      dispatchEvent: vi.fn((event) => {
        dispatchedEvents.push(event);
      }),
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createOrchestrator = () => {
    const players = [createMockAudio(), createMockAudio(), createMockAudio(), createMockAudio()];
    let index = 0;

    const orchestrator = new AudioOrchestrator({
      createAudio: () => players[index++],
      windowRef,
    });

    return { orchestrator, players };
  };

  it('buffers arrival audio before playing and firing the visual sync event', async () => {
    const { orchestrator } = createOrchestrator();

    const transitionPromise = orchestrator.transitionTo(
      AUDIO_MODES.ARRIVAL,
      { arrival: '/audio/arrival.mp3' },
      { syncVisual: true }
    );

    await vi.advanceTimersByTimeAsync(FADE_DURATION_MS);
    await transitionPromise;

    expect(orchestrator.arrivalPlayer.play).toHaveBeenCalled();
    expect(dispatchedEvents).toHaveLength(0);

    await vi.advanceTimersByTimeAsync(VISUAL_SYNC_DELAY_MS);

    expect(dispatchedEvents).toHaveLength(1);
    expect(dispatchedEvents[0].type).toBe(AUDIO_SYNC_EVENT);
    expect(orchestrator.getState().visualSyncFired).toBe(true);
  });

  it('does not fire the visual sync event twice for the same immersive session', async () => {
    const { orchestrator } = createOrchestrator();

    const transitionPromise = orchestrator.transitionTo(
      AUDIO_MODES.ARRIVAL,
      { arrival: '/audio/arrival.mp3' },
      { syncVisual: true }
    );

    await vi.advanceTimersByTimeAsync(FADE_DURATION_MS);
    await transitionPromise;
    await vi.advanceTimersByTimeAsync(VISUAL_SYNC_DELAY_MS);

    orchestrator.scheduleVisualSync(orchestrator.getState().syncGeneration);
    await vi.advanceTimersByTimeAsync(VISUAL_SYNC_DELAY_MS);

    expect(dispatchedEvents).toHaveLength(1);
  });

  it('prefetches the arrival track for approach buffering', () => {
    const { orchestrator } = createOrchestrator();

    orchestrator.prefetchArrival('/audio/arrival.mp3');

    expect(orchestrator.arrivalPlayer.src).toBe('/audio/arrival.mp3');
    expect(orchestrator.arrivalPlayer.load).toHaveBeenCalled();
    expect(orchestrator.getState().prefetchedArrivalUrl).toBe('/audio/arrival.mp3');
  });

  it('resumes arrival audio after returning from the background', async () => {
    const { orchestrator } = createOrchestrator();
    orchestrator.currentMode = AUDIO_MODES.ARRIVAL;
    orchestrator.arrivalPlayer.paused = false;

    orchestrator.onPageHidden();
    orchestrator.arrivalPlayer.paused = true;

    await orchestrator.onPageVisible();

    expect(orchestrator.arrivalPlayer.play).toHaveBeenCalled();
    expect(orchestrator.playingBeforeHidden).toBe(false);
  });

  it('does not resume or re-sync when arrival audio was not playing before hide', async () => {
    const { orchestrator } = createOrchestrator();
    orchestrator.currentMode = AUDIO_MODES.ARRIVAL;
    orchestrator.arrivalPlayer.paused = true;

    orchestrator.onPageHidden();
    await orchestrator.onPageVisible();

    expect(orchestrator.arrivalPlayer.play).not.toHaveBeenCalled();
  });

  it('cancels stale visual sync work when stop is called', async () => {
    const { orchestrator } = createOrchestrator();

    const transitionPromise = orchestrator.transitionTo(
      AUDIO_MODES.ARRIVAL,
      { arrival: '/audio/arrival.mp3' },
      { syncVisual: true }
    );

    orchestrator.stop();
    await vi.advanceTimersByTimeAsync(FADE_DURATION_MS);
    await transitionPromise;
    await vi.advanceTimersByTimeAsync(VISUAL_SYNC_DELAY_MS);

    expect(dispatchedEvents).toHaveLength(0);
    expect(orchestrator.getState().visualSyncFired).toBe(false);
  });
});
