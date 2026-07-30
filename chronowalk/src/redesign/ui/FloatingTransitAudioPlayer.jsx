import { useEffect, useMemo, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { T } from '../tokens.js'
import { formatRemainingShort } from '../lib/walkingCompanionFormat.js'

const BAR_HEIGHTS = [0.22, 0.38, 0.52, 0.72, 1, 0.82, 0.58, 0.34]

function TinyWaveform({ playing, progress }) {
  return (
    <div className="cw-ftap__wave" aria-hidden>
      {BAR_HEIGHTS.map((height, index) => {
        const filled = progress >= (index + 1) / BAR_HEIGHTS.length
        return (
          <span
            key={index}
            className={`cw-ftap__wave-bar${playing ? ' cw-ftap__wave-bar--live' : ''}${filled ? ' cw-ftap__wave-bar--filled' : ''}`}
            style={{ '--bar-height': height }}
          />
        )
      })}
    </div>
  )
}

/**
 * Mini floating companion for transit narration · Apple Maps / Music mini-player feel.
 * Tap the card (not play) to open the full narration player.
 */
export default function FloatingTransitAudioPlayer({
  visible = false,
  title = 'Approaching the Colosseum',
  narrationPlaying = false,
  currentTime = 0,
  duration = 0,
  accent = T.actI,
  onToggle,
  onOpenFullPlayer,
  testId = 'transit-audio-panel',
  className = '',
}) {
  const [mounted, setMounted] = useState(visible)
  const [present, setPresent] = useState(visible)

  useEffect(() => {
    if (visible) {
      setMounted(true)
      const frame = requestAnimationFrame(() => setPresent(true))
      return () => cancelAnimationFrame(frame)
    }
    setPresent(false)
    const timer = window.setTimeout(() => setMounted(false), 420)
    return () => window.clearTimeout(timer)
  }, [visible])

  const progress = useMemo(() => {
    if (!duration || duration <= 0) return narrationPlaying ? 0.06 : 0
    return Math.min(Math.max(currentTime / duration, 0), 1)
  }, [currentTime, duration, narrationPlaying])

  const remaining = duration > 0 ? Math.max(duration - currentTime, 0) : 0

  if (!mounted) return null

  return (
    <div
      className={`cw-ftap${present ? ' cw-ftap--visible' : ''}${className ? ` ${className}` : ''}`}
      data-testid={testId}
      style={{ '--ftap-accent': accent }}
    >
      <div className="cw-ftap__card">
        <button
          type="button"
          className="cw-ftap__play cw-wc-pressable"
          onClick={onToggle}
          aria-label={narrationPlaying ? 'Pause narration' : 'Play narration'}
        >
          {narrationPlaying ? (
            <Pause size={16} fill={T.obsidian} color={T.obsidian} />
          ) : (
            <Play size={16} fill={T.obsidian} color={T.obsidian} style={{ marginLeft: 1 }} />
          )}
        </button>

        <button
          type="button"
          className="cw-ftap__body cw-wc-pressable"
          onClick={onOpenFullPlayer}
          aria-label={`Open full narration player for ${title}`}
        >
          <span className="cw-ftap__copy">
            <span className="cw-ftap__title">{title}</span>
            <TinyWaveform playing={narrationPlaying} progress={progress} />
            <span className="cw-ftap__meta">
              <span className="cw-ftap__progress-track" aria-hidden>
                <span
                  className="cw-ftap__progress-fill"
                  style={{ transform: `scaleX(${progress})` }}
                />
              </span>
              <span className="cw-ftap__remaining">{formatRemainingShort(remaining)}</span>
            </span>
          </span>
        </button>
      </div>
    </div>
  )
}
