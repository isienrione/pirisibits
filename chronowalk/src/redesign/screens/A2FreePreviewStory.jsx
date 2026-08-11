import { T, F } from '../tokens.js'
import { buildImmersivePlayerProps } from '../lib/waypointImmersiveProps.js'
import C6ImmersivePlayer from './C6ImmersivePlayer.jsx'
import { useI18n } from '../../i18n/I18nProvider.jsx'

/**
 * Free Pantheon preview - same unified immersive layout as every journey stop.
 */
export default function A2FreePreviewStory({
  manifest,
  waypoint,
  waypointId = 'w17',
  eyebrowLabel,
  narrationPlaying = false,
  audioAvailable = true,
  currentTime = 0,
  duration = 0,
  storyEnded = false,
  continueLabel,
  initialTab = 'audio',
  /** Pantheon exterior free chapter is Part 1 of 4 total Pantheon chapters. */
  chapterCount = 4,
  onTogglePlay,
  onSkipBack,
  onSkipForward,
  onSeek,
  onThresholdCross,
  onStoryComplete,
  onBack,
  demoAutoReveal = false,
  suppressAutoRevealInvite = false,
}) {
  const { t } = useI18n()
  const resolvedEyebrow = eyebrowLabel ?? t('pantheon.preview.eyebrow')
  const resolvedContinue = continueLabel ?? t('pantheon.preview.continue')

  const playerProps = buildImmersivePlayerProps({
    waypoint,
    waypointId,
    manifest,
    storyEnded,
    initialTab,
    audio: {
      narrationPlaying,
      currentTime,
      duration,
      audioAvailable,
      chapterCount,
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
    continueLabel: resolvedContinue,
  })

  return (
    <div style={{ background: T.obsidian, height: '100%', fontFamily: F.body, position: 'relative', overflow: 'hidden' }}>
      <C6ImmersivePlayer
        {...playerProps}
        actLabel={resolvedEyebrow}
        forceDiegeticHint
        demoAutoReveal={demoAutoReveal}
        suppressAutoRevealInvite={suppressAutoRevealInvite}
      />
    </div>
  )
}
