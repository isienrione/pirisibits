import { mediaUrl } from '../lib/mediaUrl'

/** Pantheon demo pair for landing threshold (M8) and local dev testing. */
export const THRESHOLD_DEMO_WAYPOINT = {
  id: 'demo-pantheon',
  name: 'The Pantheon',
  reconstruction: {
    now: mediaUrl('/rome/img/w13_now.avif') ?? '/rome/img/w13_now.avif',
    then: mediaUrl('/rome/img/w13_then.avif') ?? '/rome/img/w13_then.avif',
    loop: mediaUrl('/rome/video/w13_then_loop.mp4') ?? '/rome/video/w13_then_loop.mp4',
    caption:
      'Evidence-based reconstruction · portico bronze finish is informed conjecture',
  },
  thenSoundscape: mediaUrl('/rome/audio/ambience_then.mp3'),
  nowAmbience: mediaUrl('/rome/audio/ambience_now.mp3'),
}

export const THRESHOLD_HOLD_MS = 2400
export const THRESHOLD_RELEASE_MS = 900
