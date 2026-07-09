import { T, F } from '../tokens.js'
import { buildImmersivePlayerProps } from '../lib/waypointImmersiveProps.js'
import C6ImmersivePlayer from './C6ImmersivePlayer.jsx'

/**
 * Free Pantheon preview — same unified immersive layout as every journey stop.
 */
export default function A2FreePreviewStory({
  manifest,
  waypoint,
  waypointId = 'w17',
  eyebrowLabel = 'FREE PREVIEW · PANTHEON',
  narrationPlaying = false,
  audioAvailable = true,
  currentTime = 0,
  duration = 0,
  storyEnded = false,
  continueLabel = 'See the full tour →',
  onTogglePlay,
  onSkipBack,
  onSkipForward,
  onSeek,
  onThresholdCross,
  onStoryComplete,
  onBack,
}) {
  const playerProps = buildImmersivePlayerProps({
    waypoint,
    waypointId,
    manifest,
    storyEnded,
    audio: {
      narrationPlaying,
      currentTime,
      duration,
      audioAvailable,
    },
    handlers: {
      onTogglePlay,
      onSkipBack,
      onSkipForward,
      onSeek,
      onThresholdCross,
      onStoryComplete,
      onBack,
    },
    continueLabel,
  })

  return (
    <div style={{ background: T.obsidian, height: '100%', fontFamily: F.body, position: 'relative', overflow: 'hidden' }}>
      <C6ImmersivePlayer
        {...playerProps}
        actLabel={eyebrowLabel}
        forceRevealInvite
      />
    </div>
  )
}
