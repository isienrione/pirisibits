import { useRef } from 'react'
import { Play, Pause, SkipBack, SkipForward, X } from 'lucide-react'
import { T } from '../tokens.js'
import { formatPlaybackSpeed } from '../../utils/appPreferences.js'
import { formatPlaybackClock } from '../lib/walkingCompanionFormat.js'
import KaraokeTranscript from './KaraokeTranscript.jsx'
import { useT } from '../../i18n/I18nProvider.jsx'

export default function TransitNarrationSheet({
  open = false,
  title,
  narrationPlaying = false,
  currentTime = 0,
  duration = 0,
  playbackRate = 1,
  transcript = '',
  accent = T.actI,
  progress = 0,
  displayTime = 0,
  remaining = 0,
  onClose,
  onToggleAudio,
  onSkipBack,
  onSkipForward,
  onCycleSpeed,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}) {
  const t = useT()
  const seekTrackRef = useRef(null)

  if (!open) return null

  return (
    <div className="cw-transit-full-player" role="dialog" aria-modal="true" data-testid="transit-full-player">
      <button
        type="button"
        className="cw-transit-full-player__backdrop cw-wc-pressable"
        aria-label={t('walk.audio.closePlayer')}
        onClick={onClose}
      />
      <div className="cw-transit-full-player__sheet">
        <div className="cw-transit-full-player__header">
          <h2 className="cw-transit-full-player__title">{title}</h2>
          <button
            type="button"
            className="cw-transit-full-player__close cw-wc-pressable"
            onClick={onClose}
            aria-label={t('action.close')}
          >
            <X size={18} />
          </button>
        </div>

        <div className="cw-transit-full-player__transport">
          {onSkipBack ? (
            <button type="button" className="cw-wc-pressable" onClick={onSkipBack} aria-label={t('walk.audio.back15')}>
              <SkipBack size={20} />
            </button>
          ) : null}
          <button
            type="button"
            className="cw-transit-full-player__play cw-wc-pressable"
            onClick={onToggleAudio}
            aria-label={narrationPlaying ? t('walk.audio.pause') : t('walk.audio.play')}
          >
            {narrationPlaying ? (
              <Pause size={22} fill={T.obsidian} color={T.obsidian} />
            ) : (
              <Play size={22} fill={T.obsidian} color={T.obsidian} style={{ marginLeft: 2 }} />
            )}
          </button>
          {onSkipForward ? (
            <button type="button" className="cw-wc-pressable" onClick={onSkipForward} aria-label={t('walk.audio.forward15')}>
              <SkipForward size={20} />
            </button>
          ) : null}
        </div>

        <div
          ref={seekTrackRef}
          className="cw-transit-full-player__seek"
          onPointerDown={(e) => onPointerDown?.(e, seekTrackRef)}
          onPointerMove={(e) => onPointerMove?.(e, seekTrackRef)}
          onPointerUp={(e) => onPointerUp?.(e, seekTrackRef)}
          onPointerCancel={(e) => onPointerUp?.(e, seekTrackRef)}
        >
          <div className="cw-transit-full-player__seek-track">
            <div
              className="cw-transit-full-player__seek-fill"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>

        <div className="cw-transit-full-player__times">
          <span>{formatPlaybackClock(displayTime)}</span>
          <span>{duration > 0 ? `−${formatPlaybackClock(remaining)}` : ''}</span>
        </div>

        <div className="cw-transit-full-player__tools">
          {onCycleSpeed ? (
            <button type="button" className="cw-wc-pressable" onClick={onCycleSpeed}>
              {formatPlaybackSpeed(playbackRate)}
            </button>
          ) : null}
          {transcript ? (
            <button type="button" className="cw-transit-full-player__read cw-wc-pressable" data-testid="transit-read-toggle">
              {t('walk.audio.read')}
            </button>
          ) : null}
        </div>

        {transcript ? (
          <div className="cw-transit-full-player__read-scroll" data-testid="transit-read-scroll">
            <KaraokeTranscript
              transcript={transcript}
              currentTime={currentTime}
              duration={duration}
              playing={narrationPlaying}
              accent={accent}
              fontSize={17}
              readingMode
              testId="transit-transcript"
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
