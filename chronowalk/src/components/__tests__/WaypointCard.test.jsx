import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import WaypointCard from '../WaypointCard';
import { JOURNEY_STATE } from '../../hooks/useGeoLocation';
import { AUDIO_MODES, AUDIO_SYNC_EVENT } from '../../audio/AudioOrchestrator';

vi.mock('../BeforeAfterSlider', () => ({
  default: () => <div data-testid="before-after-slider">Slider</div>,
}));

const { transitionTo, pauseArrival, resumeArrival } = vi.hoisted(() => ({
  transitionTo: vi.fn(),
  pauseArrival: vi.fn(),
  resumeArrival: vi.fn(),
}));

vi.mock('../../audio/AudioOrchestrator', () => ({
  AUDIO_MODES: {
    AMBIENT: 'AMBIENT',
    TRANSIT: 'TRANSIT',
    ARRIVAL: 'ARRIVAL',
  },
  AUDIO_SYNC_EVENT: 'AUDIO_SYNC_TRIGGER',
  AUDIO_PLAYBACK_STATE_EVENT: 'AUDIO_PLAYBACK_STATE',
  audioOrchestrator: {
    transitionTo,
    pauseArrival,
    resumeArrival,
  },
}));

vi.mock('../../hooks/useAudioPlaybackState', () => ({
  useAudioPlaybackState: () => ({
    needsResumeAudio: false,
    playbackInterrupted: false,
    isArrivalAudioPlaying: false,
    hasArrivalAudioSession: false,
  }),
}));

vi.mock('../../hooks/useDeviceTilt', () => ({
  requestDeviceTiltPermission: vi.fn(async () => true),
}));

const waypoint = {
  id: 'colosseum',
  title: 'The Colosseum',
  arrival_headline: "You've reached the Colosseum!",
  arrival_subtitle: 'Ancient Rome awaits.',
  immersive_orientation_hint: 'Stand facing the Colosseum facade before you begin.',
  modern_video_url: '/modern.mp4',
  ancient_video_url: '/ancient.mp4',
  arrival_immersive_url: '/audio/arrival.mp3',
  transit_narrative_url: '/audio/transit.mp3',
  ambient_url: '/audio/ambient.mp3',
};

describe('WaypointCard', () => {
  beforeEach(() => {
    transitionTo.mockReset();
    pauseArrival.mockReset();
    resumeArrival.mockReset();
  });

  it('shows orientation guidance before immersive mode begins', () => {
    render(<WaypointCard waypoint={waypoint} state={JOURNEY_STATE.ARRIVAL} onClose={() => {}} />);

    expect(screen.getByText("You've arrived")).toBeInTheDocument();
    expect(screen.getByText(waypoint.immersive_orientation_hint)).toBeInTheDocument();
    expect(screen.queryByTestId('before-after-slider')).not.toBeInTheDocument();
  });

  it('reveals the slider only after the audio sync event fires', async () => {
    render(<WaypointCard waypoint={waypoint} state={JOURNEY_STATE.ARRIVAL} onClose={() => {}} />);

    await act(async () => {
      fireEvent(window, new CustomEvent(AUDIO_SYNC_EVENT, { detail: { generation: 1 } }));
    });

    expect(screen.getByTestId('before-after-slider')).toBeInTheDocument();
    expect(screen.getByText('Then & now')).toBeInTheDocument();
  });

  it('ignores stale sync events from an older generation', async () => {
    render(<WaypointCard waypoint={waypoint} state={JOURNEY_STATE.ARRIVAL} onClose={() => {}} />);

    await act(async () => {
      fireEvent(window, new CustomEvent(AUDIO_SYNC_EVENT, { detail: { generation: 2 } }));
      fireEvent(window, new CustomEvent(AUDIO_SYNC_EVENT, { detail: { generation: 1 } }));
    });

    expect(screen.getByTestId('before-after-slider')).toBeInTheDocument();
  });

  it('starts immersive audio with visual sync enabled', async () => {
    render(<WaypointCard waypoint={waypoint} state={JOURNEY_STATE.ARRIVAL} onClose={() => {}} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Reveal ancient view' }));
    });

    expect(transitionTo).toHaveBeenCalledWith(
      AUDIO_MODES.ARRIVAL,
      expect.objectContaining({
        arrival: waypoint.arrival_immersive_url,
      }),
      { syncVisual: true }
    );
  });

  it('shows audio and immersive actions in a premium layout', () => {
    render(<WaypointCard waypoint={waypoint} state={JOURNEY_STATE.ARRIVAL} onClose={() => {}} />);

    const audioButton = screen.getByRole('button', { name: 'Start audio story' });
    expect(audioButton).toBeInTheDocument();

    const revealButton = screen.getByRole('button', { name: 'Reveal ancient view' });
    expect(
      revealButton.compareDocumentPosition(audioButton) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    expect(screen.getByRole('button', { name: 'Compare then & now' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue walking' })).toBeInTheDocument();
  });
});
