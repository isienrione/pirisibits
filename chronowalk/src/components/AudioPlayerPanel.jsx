import { AudioPlayer } from './audio/AudioPlayer'
import { useAudioPlaybackState } from '../hooks/useAudioPlaybackState'
import { cn } from './ui'

function AudioPlayerPanel({
  title,
  subtitle,
  isPlaying,
  onToggle,
  onStop,
  posterUrl,
  className,
}) {
  const {
    currentTime,
    duration,
    playbackRate,
    seekTo,
    cyclePlaybackRate,
  } = useAudioPlaybackState()

  return (
    <AudioPlayer
      layout="expanded"
      title={title}
      subtitle={subtitle}
      modeLabel="Audio story"
      posterUrl={posterUrl}
      isPlaying={isPlaying}
      currentTime={currentTime}
      duration={duration}
      playbackRate={playbackRate}
      onToggle={onToggle}
      onStop={onStop}
      onSeek={seekTo}
      onCyclePlaybackRate={cyclePlaybackRate}
      animateOnPlay
      className={cn('animate-fade-in-soft', className)}
    />
  )
}

export default AudioPlayerPanel
