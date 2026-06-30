import { useState } from 'react'
import { useAudioProgress } from '../hooks/useAudioProgress'
import { cyclePlaybackSpeed } from '../utils/appPreferences'
import AudioTranscriptSection from './AudioTranscriptSection'
import DockedAudioMiniPlayer from './DockedAudioMiniPlayer'
import { AudioScrubber, GoldButton, cn, focusRing } from './ui'

function PlayIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.14v13.72L19 12 8 5.14Z" />
    </svg>
  )
}

function PauseIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  )
}

function TabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'min-h-11 flex-1 border-b-2 px-3 pb-3 pt-1 text-sm font-semibold transition',
        active
          ? 'border-bronze text-deep-slate'
          : 'border-transparent text-soft-slate hover:text-deep-slate',
        focusRing
      )}
    >
      {children}
    </button>
  )
}

function AudioTabControls({ isPlaying, onToggle, onSkipBack, onSkipForward }) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        type="button"
        onClick={onSkipBack}
        aria-label="Rewind 15 seconds"
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full border border-parchment/80 bg-ivory text-sm font-semibold text-deep-slate shadow-sm',
          focusRing
        )}
      >
        −15
      </button>

      <GoldButton
        size="lg"
        onClick={onToggle}
        aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
        className="h-14 w-14 min-h-14 min-w-14 rounded-full p-0 shadow-gold-glow"
      >
        {isPlaying ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="ml-0.5 h-6 w-6" />}
      </GoldButton>

      <button
        type="button"
        onClick={onSkipForward}
        aria-label="Forward 15 seconds"
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full border border-parchment/80 bg-ivory text-sm font-semibold text-deep-slate shadow-sm',
          focusRing
        )}
      >
        +15
      </button>
    </div>
  )
}

export function AudioTranscriptTabs({
  waypoint,
  title,
  subtitle,
  posterUrl,
  isPlaying,
  onToggle,
  onStop,
  onOpenFullPlayer,
  showHeader = true,
  showDockedPlayer = true,
  showAudioControls = true,
  className,
}) {
  const [activeTab, setActiveTab] = useState('audio')
  const { currentTime, duration, playbackRate, seekTo, skipBy, setPlaybackRate } = useAudioProgress()

  const handleSpeedChange = () => {
    const next = cyclePlaybackSpeed(playbackRate)
    setPlaybackRate(next)
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-3xl border border-parchment/80 bg-ivory shadow-plaque',
        className
      )}
    >
      {showHeader ? (
        <div className="border-b border-obsidian/20 bg-obsidian px-4 py-3.5 text-ivory">
          <p className="font-display text-lg font-semibold leading-tight">{title}</p>
          {subtitle ? <p className="mt-1 text-sm text-parchment/80">{subtitle}</p> : null}
        </div>
      ) : null}

      <div className="flex border-b border-parchment/70 bg-parchment/15 px-4" role="tablist" aria-label="Audio and transcript">
        <TabButton active={activeTab === 'audio'} onClick={() => setActiveTab('audio')}>
          Audio
        </TabButton>
        <TabButton active={activeTab === 'transcript'} onClick={() => setActiveTab('transcript')}>
          Transcript
        </TabButton>
      </div>

      <div className="px-4 py-5">
        {activeTab === 'audio' ? (
          <div role="tabpanel" className="space-y-5">
            {showAudioControls ? (
              <>
                <AudioScrubber
                  currentTime={currentTime}
                  duration={duration}
                  onSeek={seekTo}
                  disabled={duration <= 0}
                />
                <AudioTabControls
                  isPlaying={isPlaying}
                  onToggle={onToggle}
                  onSkipBack={() => skipBy(-15)}
                  onSkipForward={() => skipBy(15)}
                />
              </>
            ) : null}

            <div className="flex gap-2 rounded-2xl border border-parchment/70 bg-parchment/20 p-2">
              <button
                type="button"
                onClick={handleSpeedChange}
                className={cn(
                  'min-h-11 flex-1 rounded-xl px-3 py-2 text-center text-sm font-semibold text-deep-slate hover:bg-parchment/50',
                  focusRing
                )}
              >
                Speed · {playbackRate}x
              </button>
              <button
                type="button"
                disabled
                className="min-h-11 flex-1 rounded-xl px-3 py-2 text-center text-sm font-semibold text-soft-slate/70"
              >
                Chapters · Soon
              </button>
            </div>
          </div>
        ) : (
          <div role="tabpanel">
            <AudioTranscriptSection waypoint={waypoint} expandable serif />
          </div>
        )}
      </div>

      {showDockedPlayer ? (
        <div className="border-t border-parchment/60 bg-parchment/10 p-3">
          <DockedAudioMiniPlayer
            title={title}
            subtitle={subtitle}
            posterUrl={posterUrl}
            onTogglePlayback={onToggle}
            onStop={onStop}
            onExpand={onOpenFullPlayer}
          />
        </div>
      ) : null}
    </div>
  )
}

export default AudioTranscriptTabs
