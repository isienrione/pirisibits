import { useState } from 'react'
import { AUDIO_MODES } from '../audio/AudioOrchestrator'
import { useAudioPlaybackState } from '../hooks/useAudioPlaybackState'
import { AudioPlayer } from './audio/AudioPlayer'
import { GlassPanel } from './ui'

function PersistentAudioBar({
  title,
  subtitle,
  posterUrl,
  cardOpen,
  onReopenCard,
  onTogglePlayback,
  onStop,
  onLayoutChange,
}) {
  const {
    isTourNarrationActive,
    isTourNarrationPlaying,
    currentMode,
    currentTime,
    duration,
    playbackRate,
    seekTo,
    cyclePlaybackRate,
  } = useAudioPlaybackState()
  const [layout, setLayout] = useState('mini')

  const handleLayoutChange = (nextLayout) => {
    setLayout(nextLayout)
    onLayoutChange?.(nextLayout)
  }

  if (!isTourNarrationActive) return null

  const modeLabel =
    currentMode === AUDIO_MODES.TRANSIT
      ? 'Walking narration'
      : currentMode === AUDIO_MODES.ARRIVAL
        ? 'Audio story'
        : 'Tour audio'

  if (layout === 'expanded') {
    return (
      <div className="pointer-events-auto w-full animate-fade-in-soft">
        <AudioPlayer
          layout="expanded"
          title={title ?? 'Landmark story'}
          subtitle={subtitle}
          modeLabel={modeLabel}
          posterUrl={posterUrl}
          isPlaying={isTourNarrationPlaying}
          currentTime={currentTime}
          duration={duration}
          playbackRate={playbackRate}
          onToggle={onTogglePlayback}
          onStop={() => {
            handleLayoutChange('mini')
            onStop?.()
          }}
          onSeek={seekTo}
          onCyclePlaybackRate={cyclePlaybackRate}
          onLayoutChange={handleLayoutChange}
          onReopenCard={onReopenCard}
          cardOpen={cardOpen}
        />
      </div>
    )
  }

  return (
    <div className="pointer-events-auto w-full">
      <GlassPanel className="overflow-hidden rounded-2xl border-deep-slate/10 bg-deep-slate/96 text-warm-white shadow-glass-lg backdrop-blur-glass">
        <AudioPlayer
          layout={layout}
          title={title ?? 'Landmark story'}
          subtitle={subtitle}
          modeLabel={modeLabel}
          posterUrl={posterUrl}
          isPlaying={isTourNarrationPlaying}
          currentTime={currentTime}
          duration={duration}
          playbackRate={playbackRate}
          onToggle={onTogglePlayback}
          onStop={() => {
            handleLayoutChange('mini')
            onStop?.()
          }}
          onSeek={seekTo}
          onCyclePlaybackRate={cyclePlaybackRate}
          onLayoutChange={handleLayoutChange}
          onReopenCard={onReopenCard}
          cardOpen={cardOpen}
        />
      </GlassPanel>
    </div>
  )
}

export default PersistentAudioBar
